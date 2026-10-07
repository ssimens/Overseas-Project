// Francesco Simeoni - Alessandro Marchiorato | PROGETTO TAW | A.A 2025/2026

// Questo file contiene il middleware per caricare sul server learning agreement e transcripts of records

const multer = require("multer");
const fs = require("fs");
const path = require("path");

const uploadPath = path.join(__dirname, "..", "uploads");

function creaStorage(docType) {
    return multer.diskStorage({

        destination: (req, file, cb) => {
            let folderName;

            if (req.params && req.params.idapplication)
                folderName = req.params.idapplication.toString();

            // Genero path per la cartella
            const cartella = path.join(
                uploadPath,
                folderName,
                docType
            );

            // Elimina la cartella e tutto il suo contenuto
            fs.rmSync(cartella, {
                recursive: true,
                force: true
            });

            // Creo cartella e le necessarie per raggiungerla
            fs.mkdirSync(cartella, { recursive: true });

            cb(null, cartella);
        },

        filename: (req, file, cb) => {
            cb(null, file.originalname);
        }
    });
}

const uploadLearningAgreement = multer({
    storage: creaStorage("learning-agreement")
});

const uploadTranscriptOfRecords = multer({
    storage: creaStorage("transcripts-of-records")
});

module.exports = {
    uploadLearningAgreement,
    uploadTranscriptOfRecords
};