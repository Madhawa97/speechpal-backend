import express from "express";
import multer from "multer";
import SpeechToTextV1 from "ibm-watson/speech-to-text/v1.js";
import { IamAuthenticator } from "ibm-watson/auth/index.js";
import dotenv from "dotenv";
import fs from "fs";
import cors from 'cors';

dotenv.config();

const app = express();

const upload = multer();

const speechToText = new SpeechToTextV1({
    authenticator: new IamAuthenticator({
        apikey: process.env.API_KEY,
    }),
    serviceUrl: process.env.SERVICE_URL,
});

app.use(cors());

app.get("/", (req, res) => {
    res.send("Audio Server Running...");
});

app.post("/postAudio", upload.single("audio"), async (req, res) => {
    console.log("Request Processing...")
    try {
        const { file } = req;

        if (file) {
            const fileName = `${file.originalname }-${ Date.now() }${path.extname(file.originalname)}`;
            fs.writeFileSync(fileName, file.buffer);

            console.log(">>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>",file.mimetype)
            const params = {
                audio: file.buffer,
                contentType: file.mimetype,
            };

            const { result } = await speechToText.recognize(params);

            if (result.results.length > 0) {
                const transcript = result.results[0].alternatives[0].transcript;
                res.json({ transcript });
            } else {
                res.json({ transcript: null });
            }
        } else {
            res.status(400).json({ error: "No file found." });
        }
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: err });
    }
});

const port = process.env.PORT || 3000;

app.listen(port, () => {
    console.log(`Server running on port ${port}`);
});