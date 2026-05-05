from flask import Flask, render_template, Response, jsonify
import cv2
import os
import time

app = Flask(__name__)

# ================= CAMERA =================
camera = cv2.VideoCapture(0)

# ================= CASCADES =================
BASE_PATH = os.path.dirname(__file__)

face_cascade = cv2.CascadeClassifier(
    os.path.join(BASE_PATH, "haarcascade_frontalface_default.xml")
)
smile_cascade = cv2.CascadeClassifier(
    os.path.join(BASE_PATH, "haarcascade_smile.xml")
)

# ================= EMOTION STATE =================
CURRENT_EMOTION = "Neutral 😐"
last_smile_time = time.time()
# ===============================================

def generate_frames():
    global CURRENT_EMOTION, last_smile_time

    while True:
        success, frame = camera.read()
        if not success:
            break

        gray = cv2.cvtColor(frame, cv2.COLOR_BGR2GRAY)

        faces = face_cascade.detectMultiScale(
            gray,
            scaleFactor=1.1,
            minNeighbors=5,
            minSize=(80, 80)
        )

        for (x, y, w, h) in faces:
            roi_gray = gray[y:y+h, x:x+w]

            smiles = smile_cascade.detectMultiScale(
                roi_gray,
                scaleFactor=1.7,
                minNeighbors=20
            )

            now = time.time()

            # -------- EMOTION LOGIC --------
            if len(smiles) > 0:
                CURRENT_EMOTION = "Happy 😊"
                last_smile_time = now
            else:
                elapsed = now - last_smile_time
                if elapsed < 2:
                    CURRENT_EMOTION = "Neutral 😐"
                else:
                    CURRENT_EMOTION = "Sad 😔"
            # -------------------------------

            # Draw face box
            cv2.rectangle(
                frame,
                (x, y),
                (x + w, y + h),
                (0, 255, 0),
                2
            )

            # Draw emotion on video
            cv2.putText(
                frame,
                CURRENT_EMOTION,
                (x, y - 10),
                cv2.FONT_HERSHEY_SIMPLEX,
                0.9,
                (255, 0, 0),
                2
            )

        ret, buffer = cv2.imencode(".jpg", frame)
        frame = buffer.tobytes()

        yield (
            b"--frame\r\n"
            b"Content-Type: image/jpeg\r\n\r\n" + frame + b"\r\n"
        )

# ================= ROUTES =================

@app.route("/")
def index():
    return render_template("index.html")

@app.route("/video_feed")
def video_feed():
    return Response(
        generate_frames(),
        mimetype="multipart/x-mixed-replace; boundary=frame"
    )

@app.route("/emotion")
def emotion_api():
    return jsonify({"emotion": CURRENT_EMOTION})

# ================= RUN =================
if __name__ == "__main__":
    app.run(debug=True)
