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
    try {
        const { file } = req;

        if (file) {
            const fileName = `${file.originalname}-${Date.now()}.webm`;
            fs.writeFileSync(fileName, file.buffer);                   // !TODO - Save these in a db and add auth
            console.log(">>>>>>>>>>>>> Request Processing...");

            const params = {
                audio: file.buffer,
                contentType: "audio/webm",
            };
            const { result } = await speechToText.recognize(params);
            console.log(JSON.stringify(result));

            if (result.results.length > 0) {
                const results = result.results;
                const transcriptions = results.map(result => {
                    const alternatives = result.alternatives;
                    const highestConfidenceAlt = alternatives.reduce((prev, current) => {
                        return prev.confidence > current.confidence ? prev : current;
                    }, {});
                    return highestConfidenceAlt.transcript;
                });

                const transcript = transcriptions.join(' ');               
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