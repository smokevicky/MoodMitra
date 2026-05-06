"""
MoodMitra — VibeSenseAI Backend
Emotion detection using FER+ ONNX model (Microsoft Research)
  - Trained on 35,887 labelled face images
  - 8 emotion classes, ~85%+ accuracy
  - Runs with onnxruntime — no TensorFlow needed
"""

from flask import Flask, render_template, Response, jsonify, request
from flask_cors import CORS
import cv2
import os
import time
import math
import base64
import numpy as np

app = Flask(__name__)
CORS(app)

BASE_PATH = os.path.dirname(__file__)

# ─── CASCADE DETECTORS ───────────────────────────────────────────────────────
face_cascade = cv2.CascadeClassifier(
    os.path.join(BASE_PATH, "haarcascade_frontalface_default.xml")
)

# ─── FER+ ONNX MODEL ─────────────────────────────────────────────────────────
# FER+ labels (8 classes from the dataset)
FERPLUS_LABELS = ["neutral", "happiness", "surprise", "sadness",
                  "anger", "disgust", "fear", "contempt"]

# Map FER+ labels → face-api.js names
LABEL_MAP = {
    "neutral":   "neutral",
    "happiness": "happy",
    "surprise":  "surprised",
    "sadness":   "sad",
    "anger":     "angry",
    "disgust":   "disgusted",
    "fear":      "fearful",
    "contempt":  "neutral",   # merge contempt → neutral
}

ort_session = None
MODEL_PATH  = os.path.join(BASE_PATH, "emotion_ferplus.onnx")

try:
    import onnxruntime as ort
    ort_session = ort.InferenceSession(
        MODEL_PATH,
        providers=["CPUExecutionProvider"]
    )
    print("✅ FER+ ONNX emotion model loaded  →  emotion_ferplus.onnx")
    print(f"   Input : {ort_session.get_inputs()[0].shape}")
    print(f"   Output: {ort_session.get_outputs()[0].shape}")
except Exception as e:
    print(f"⚠️  ONNX model failed to load: {e}")
    print("   Falling back to Haar cascade heuristics.")


# ─────────────────────────────────────────────────────────────────────────────
#  HELPER — detect + crop the largest face from a frame
# ─────────────────────────────────────────────────────────────────────────────
def get_face_crop(gray_frame):
    """Returns (face_roi_gray, face_rect) or (None, None) if no face found."""
    faces = face_cascade.detectMultiScale(
        gray_frame, scaleFactor=1.1, minNeighbors=5, minSize=(48, 48)
    )
    if not len(faces):
        return None, None
    x, y, w, h = sorted(faces, key=lambda f: f[2] * f[3])[-1]
    return gray_frame[y: y + h, x: x + w], (x, y, w, h)


# ─────────────────────────────────────────────────────────────────────────────
#  PRIMARY ENGINE — FER+ ONNX neural network
# ─────────────────────────────────────────────────────────────────────────────
def predict_onnx(face_roi_gray):
    """
    Run FER+ ONNX inference on a grayscale face crop.
    Returns (dominant_emotion: str, scores: dict {str: float})
    """
    # Resize to 64x64 (model input size)
    resized = cv2.resize(face_roi_gray, (64, 64))

    # Normalise to float32, keep in [0, 255] range (FER+ model expects this)
    img = resized.astype(np.float32)

    # Shape: (1, 1, 64, 64)  — batch=1, channels=1 (grayscale), H=64, W=64
    img = img.reshape(1, 1, 64, 64)

    # Run inference
    input_name  = ort_session.get_inputs()[0].name
    raw_scores  = ort_session.run(None, {input_name: img})[0][0]  # shape (8,)

    # Softmax to get probabilities
    exp_s  = np.exp(raw_scores - np.max(raw_scores))
    probs  = exp_s / exp_s.sum()

    # Map FER+ 8-class → face-api 7-class (contempt merged into neutral)
    mapped: dict[str, float] = {}
    for i, label in enumerate(FERPLUS_LABELS):
        api_name = LABEL_MAP[label]
        mapped[api_name] = mapped.get(api_name, 0.0) + float(probs[i])

    # Round to 4 dp
    scores   = {k: round(v, 4) for k, v in mapped.items()}
    dominant = max(scores, key=scores.get)
    return dominant, scores


# ─────────────────────────────────────────────────────────────────────────────
#  FALLBACK ENGINE — Enhanced Haar cascade heuristics (no ONNX)
# ─────────────────────────────────────────────────────────────────────────────
smile_cascade = cv2.CascadeClassifier(os.path.join(BASE_PATH, "haarcascade_smile.xml"))
eye_cascade   = cv2.CascadeClassifier(os.path.join(BASE_PATH, "haarcascade_eye.xml"))

def predict_heuristic(face_roi_gray):
    h, w = face_roi_gray.shape

    # Smile — tuned parameters
    smiles = smile_cascade.detectMultiScale(
        face_roi_gray[h // 2:], scaleFactor=1.6,
        minNeighbors=18, minSize=(w // 5, h // 10)
    )
    smile_strength = min(1.0, len(smiles) * 0.5 +
                         (max(s[2] for s in smiles) / (w * 0.6) if len(smiles) else 0))

    # Eyes
    eyes = eye_cascade.detectMultiScale(
        face_roi_gray[0: h // 2], scaleFactor=1.1,
        minNeighbors=5, minSize=(20, 20)
    )
    eye_count = min(len(eyes), 2)
    eye_area  = min(1.0, sum(e[2] * e[3] for e in eyes[:2]) / (w * (h // 2) + 1) * 30)

    # Brow complexity (Canny edges in upper 25%)
    brow_edges = cv2.Canny(face_roi_gray[int(h * 0.05): int(h * 0.30)], 40, 120)
    brow_furrow = min(1.0, np.count_nonzero(brow_edges) / (brow_edges.size + 1) * 12)

    # Mouth openness (Canny edges lower 35%)
    mouth_edges  = cv2.Canny(face_roi_gray[int(h * 0.60): int(h * 0.90)], 40, 120)
    mouth_open   = min(1.0, np.count_nonzero(mouth_edges) / (mouth_edges.size + 1) * 8)
    brightness   = float(np.mean(face_roi_gray)) / 255.0

    raw = {
        "happy":     smile_strength * 0.75 + eye_count / 2 * 0.15 + brightness * 0.10,
        "surprised": eye_area * 0.45 + mouth_open * 0.35 + brow_furrow * 0.10,
        "angry":     brow_furrow * 0.55 + (1 - smile_strength) * 0.25 + (2 - eye_count) / 2 * 0.20,
        "sad":       (1 - smile_strength) * 0.40 + (1 - brightness) * 0.25 + (2 - eye_count) / 2 * 0.35,
        "fearful":   eye_area * 0.35 + brow_furrow * 0.30 + (1 - smile_strength) * 0.25,
        "disgusted": brow_furrow * 0.45 + mouth_open * 0.30 + (1 - smile_strength) * 0.25,
        "neutral":   0.0,
    }
    raw["neutral"] = max(0.0, 0.80 - sum(raw.values()))

    total  = sum(max(0, v) for v in raw.values()) or 1.0
    scores = {k: round(max(0, v) / total, 4) for k, v in raw.items()}
    return max(scores, key=scores.get), scores


# ─────────────────────────────────────────────────────────────────────────────
#  PUBLIC DETECT — tries ONNX first, falls back to heuristics
# ─────────────────────────────────────────────────────────────────────────────
def detect_emotion(frame):
    gray = cv2.cvtColor(frame, cv2.COLOR_BGR2GRAY)
    # Equalise histogram → improves detection in varied lighting
    gray = cv2.equalizeHist(gray)

    face_roi, face_rect = get_face_crop(gray)

    if face_roi is None:
        return None, None

    if ort_session is not None:
        return predict_onnx(face_roi)
    else:
        return predict_heuristic(face_roi)


# ─────────────────────────────────────────────────────────────────────────────
#  GEOMETRY — eye openness (Haar)
# ─────────────────────────────────────────────────────────────────────────────
def compute_geometry(face_roi_gray):
    """Returns eye_open (0-100) using eye Haar cascade."""
    h, w = face_roi_gray.shape
    upper = face_roi_gray[0: h // 2]
    eyes  = eye_cascade.detectMultiScale(
        upper, scaleFactor=1.1, minNeighbors=5, minSize=(18, 18)
    )
    eye_count    = min(len(eyes), 2)
    eye_open     = 20.0
    eye_center_y = h * 0.30   # default eye Y position within face

    if eye_count:
        eye_area     = sum(e[2] * e[3] for e in eyes[:2]) / (w * (h // 2) + 1)
        eye_open     = min(100.0, eye_area * 3000)
        eye_center_y = float(np.mean([(e[1] + e[3] / 2) for e in eyes[:2]])) / h

    # ── Brow raise ────────────────────────────────────────────────────
    # Signal 1: Horizontal edge strength via Sobel Y
    #   Raised brows create horizontal wrinkle lines across the forehead.
    #   Sobel Y targets only horizontal edges — ignores hair/shadow noise
    #   that Canny would pick up indiscriminately.
    brow_region = face_roi_gray[int(h * 0.05): int(h * 0.28)]
    blurred     = cv2.GaussianBlur(brow_region, (5, 5), 0)
    sobel_y     = cv2.Sobel(blurred, cv2.CV_64F, 0, 1, ksize=3)
    h_edge_mean = float(np.mean(np.abs(sobel_y)))
    # Calibration: neutral face ~4-8, raised brows ~12-20
    edge_signal = min(100.0, max(0.0, (h_edge_mean - 4.0) * 7.0))

    # Signal 2: Eye Y position within face
    #   When brows raise they pull the upper eyelid, making the eye appear
    #   to sit slightly lower relative to the face's top edge.
    #   Typical range: relaxed 0.20-0.27, raised 0.28-0.36
    pos_signal = min(100.0, max(0.0, (eye_center_y - 0.18) * 370))

    # Blend: edge signal is primary, eye position is a secondary push
    brow_raise = min(100.0, edge_signal * 0.65 + pos_signal * 0.35)

    return round(eye_open, 1), round(brow_raise, 1)



# ─── /analyze  (called from moodcam.html) ────────────────────────────────────
@app.route('/analyze', methods=['POST'])
def analyze_frame():
    try:
        data    = request.json
        img_b64 = data.get('frame', '')
        if ',' in img_b64:
            img_b64 = img_b64.split(',')[1]

        img_bytes = base64.b64decode(img_b64)
        np_arr    = np.frombuffer(img_bytes, np.uint8)
        frame     = cv2.imdecode(np_arr, cv2.IMREAD_COLOR)

        dominant, scores = detect_emotion(frame)
        engine = "onnx-ferplus" if ort_session else "opencv-heuristic"

        if dominant is None or scores is None:
            return jsonify({
                'emotion':    'none',
                'scores':     {},
                'eye_open':   0,
                'brow_raise': 0,
                'face_detected': False,
                'engine':     engine
            })

        # Derive geometric metrics from ONNX emotion scores
        # (More reliable than Haar cascade for eye/brow — FER+ encodes these features directly)
        surprised = scores.get('surprised', 0)
        fearful   = scores.get('fearful',   0)
        happy     = scores.get('happy',     0)

        # Eye openness: surprise and fear = wide eyes; happy = somewhat open; baseline = 15
        eye_open   = round(min(100.0, 15.0 + surprised * 80 + fearful * 50 + happy * 20), 1)

        # Brow raise: surprise = brows up + wide; fear = brows raised + drawn together
        brow_raise = round(min(100.0, surprised * 120 + fearful * 60), 1)

        return jsonify({
            'emotion':    dominant,
            'scores':     scores,
            'eye_open':   eye_open,
            'brow_raise': brow_raise,
            'face_detected': True,
            'engine':     engine
        })

    except Exception as e:
        return jsonify({'error': str(e), 'emotion': 'none', 'scores': {}, 'face_detected': False}), 200


# ─── Standalone Flask UI ──────────────────────────────────────────────────────
camera = cv2.VideoCapture(0)
CURRENT_EMOTION = "Neutral 😐"

EMOJI_MAP = {
    "happy": "Happy 😊", "surprised": "Surprised 😲",
    "angry": "Tense 😤",  "sad": "Sad 😔",
    "fearful": "Fearful 😨", "disgusted": "Disgusted 😒",
    "neutral": "Neutral 😐",
}

def generate_frames():
    global CURRENT_EMOTION
    while True:
        success, frame = camera.read()
        if not success:
            break

        dominant, _ = detect_emotion(frame)
        CURRENT_EMOTION = EMOJI_MAP.get(dominant, "Neutral 😐")

        gray  = cv2.cvtColor(frame, cv2.COLOR_BGR2GRAY)
        faces = face_cascade.detectMultiScale(gray, 1.1, 5, minSize=(48, 48))
        for (fx, fy, fw, fh) in faces:
            cv2.rectangle(frame, (fx, fy), (fx + fw, fy + fh), (0, 255, 0), 2)
            cv2.putText(frame, CURRENT_EMOTION, (fx, fy - 10),
                        cv2.FONT_HERSHEY_SIMPLEX, 0.8, (255, 100, 200), 2)

        ret, buf = cv2.imencode(".jpg", frame)
        yield b"--frame\r\nContent-Type: image/jpeg\r\n\r\n" + buf.tobytes() + b"\r\n"


@app.route("/")
def index():
    return render_template("index.html")

@app.route("/video_feed")
def video_feed():
    return Response(generate_frames(), mimetype="multipart/x-mixed-replace; boundary=frame")

@app.route("/emotion")
def emotion_api():
    return jsonify({"emotion": CURRENT_EMOTION})


if __name__ == "__main__":
    engine_name = "FER+ ONNX (neural net)" if ort_session else "OpenCV heuristics (fallback)"
    print(f"\n🚀  VibeSenseAI running → http://127.0.0.1:5001")
    print(f"🧠  Emotion engine: {engine_name}\n")
    app.run(debug=True, port=5001)
