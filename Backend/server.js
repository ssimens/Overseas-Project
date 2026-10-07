// Francesco Simeoni - Alessandro Marchiorato | PROGETTO TAW | A.A 2025/2026

const express = require("express");
const cors = require("cors");
const pool = require("./database");
const fun = require("./functions");
const fs = require("fs");
const jwt = require('jsonwebtoken');
const cookieParser = require("cookie-parser");
const {uploadLearningAgreement, uploadTranscriptOfRecords } = require("./middleware/upload");

const app = express();

app.use(express.json());
app.use(cookieParser());

app.use(cors({
    origin: "http://localhost:4200",
    credentials: true
}));

// - Setta sessione dell'utente
app.post("/api/login", async (req, res) =>
{
    try 
    {
        const email = req.body.email;
        const password = req.body.password;
        const result =  await pool.query(`SELECT u.idutente,
                                                 u.nome,
                                                 u.cognome,
                                                 u.email,
                                                 u.password,
                                                 u.ruolo,
                                                 u.matricola,
                                                 s.facolta
                                            FROM Utenti u 
                                            LEFT JOIN Studenti s ON s.matricola = u.matricola 
                                            LEFT JOIN docenti d ON d.idutente = u.idutente 
                                            WHERE u.Email = $1`, [email]); 
        const user = result.rows[0];
        if(await fun.verifyPassword(user.password, password))
        {
            // Genero il token con la firma
            const token = jwt.sign(
                {
                    id: user.idutente,
                    email: user.email,
                    name: user.nome,
                    surname: user.cognome,
                    matr: user.matricola,
                    role: user.ruolo,
                    faculty: user.facolta
                },
                process.env.JWT_SECRET,
                {
                    expiresIn: "2h"
                }
            );
            
            return res.status(200).cookie("token", token, {
                httpOnly: true,
                secure: false,
                sameSite: "lax"
            }).json({
                    user: {
                        id: user.idutente,
                        name: user.nome,
                        surname: user.cognome,
                        matr: user.matricola,
                        email: user.email,
                        role: user.ruolo,
                        faculty: user.facolta
                    }});
        }
        else
        {
            return res.status(401).json({
                error: "Email or password wrong"
            });
        }
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: "Error during the research of email and password" });
    }
});

// - Cancella sessione dell'utente
app.post("/api/logout", (req, res) => {

    res.clearCookie("token", {
        httpOnly: true,
        secure: false,
        sameSite: "lax"
    });

    return res.status(200).send();
});

// - Restituisce dettagli di una pratica dato id
app.get("/api/applications/:idapplication/basicinfo", fun.verifyToken, async (req, res) =>
{
    const idApplication = Number(req.params.idapplication);

    if(req.user.role != 3 && !await fun.checkStudent(idApplication, req.user.id) && !await fun.checkProfessor(idApplication, req.user.id))
        return res.status(401).json({error: "Not Authorized"});

    try 
    {
        const result = await pool.query(`SELECT p.idpratica AS id,
                                            p.annoaccademico AS year,
                                            p.statuspratica AS state,
                                            p.iduni AS "idUni",
                                            p.notestudente AS "studentNotes",
                                            p.periodoprevisto AS "scheduledPeriod",
                                            p.learningagreement AS learningagreement,
                                            p.transcriptsofrecords AS transcriptsofrecords,
                                            p.motivazionerifiutola AS "refusalMotivation",
                                            p.statusla AS "statusla",
                                            p.modificala AS "modifiedla",
                                            TO_CHAR(p.dataarrivo, 'YYYY-MM-DD') AS "arriveDate",
                                            TO_CHAR(p.datapartenza, 'YYYY-MM-DD') AS "departureDate",
                                            p.approvatamodificala AS "approvedmodifies",
                                            p.mobilitaconfermata AS "confirmedMobility",
                                            ue.nome AS "hostUni",
                                            ue.citta AS "hostUniCity" ,
                                            ue.stato AS "hostUniCountry",
                                            u.nome AS "professorName",
                                            u.cognome AS "professorSurname",
                                            u.email AS "professorEmail",
                                            us.nome AS "studentName",
                                            us.cognome AS "studentSurname",
                                            us.email AS "studentEmail"
                                FROM Pratiche p 
                                LEFT JOIN UniExtraeuropee ue ON p.iduni = ue.iduni
                                LEFT JOIN Utenti u ON p.iddoc = u.idutente
                                LEFT JOIN Utenti us ON p.idstud = us.idutente
                                WHERE p.idpratica = $1`, [idApplication]);

        return res.status(200).json(result.rows[0]);

    } catch (error) {
        console.error(error);
        res.status(500).json({ error: "Database Error" });
    }
});

// - Restituisce il learning agreement di una pratica dato il suo id
app.get("/api/applications/download/:idapplication/learningagreement", fun.verifyToken, async (req, res) => 
{
    const idApplication = req.params.idapplication;
    
    if(req.user.role != 3 && !await fun.checkStudent(idApplication, req.user.id) && !await fun.checkProfessor(idApplication, req.user.id))
        return res.status(401).json({error: "Not Authorized"});

    try 
    {
        result = await pool.query("SELECT learningagreement FROM Pratiche WHERE idpratica = $1", [idApplication]);

        if (result.rows.length === 0)
            return res.status(404).json({error: "Application not found"});

        const fileName = result.rows[0].learningagreement;
        filePath = `uploads/${idApplication}/learning-agreement/${fileName}`;

        if (!fs.existsSync(filePath))
            return res.status(404).json({error: "File not found"});

        return res.download(filePath, fileName);
    }
    catch (error) {
        console.error(error);
        res.status(500).json({
            message: "Error during the learning agreement download"
        });
    }
});

// - Restituisce il transcripts of records di una pratica dato il suo id
app.get("/api/applications/download/:idapplication/transcriptsofrecords", fun.verifyToken, async (req, res) => 
{
    const idApplication = req.params.idapplication;
    
    if(req.user.role != 3 && !await fun.checkStudent(idApplication, req.user.id) && !await fun.checkProfessor(idApplication, req.user.id))
        return res.status(401).json({error: "Not Authorized"});

    try 
    {
        result = await pool.query("SELECT transcriptsofrecords FROM Pratiche WHERE idpratica = $1", [idApplication]);
        
        if (result.rows.length === 0)
            return res.status(404).json({error: "Application not found"});

        const fileName = result.rows[0].transcriptsofrecords;
        filePath = `uploads/${idApplication}/transcripts-of-records/${fileName}`;

        if (!fs.existsSync(filePath))
            return res.status(404).json({error: "File not found"});
        
        return res.download(filePath, fileName);
    }
    catch (error) {
        console.error(error);
        res.status(500).json({
            message: "Error during the transcripts of records download"
        });
    }
});

// - Restituisce il mapping degli esami di una pratica dato l'id
app.get("/api/applications/:idapplication/mapping", fun.verifyToken, async (req, res) => {

    const idApplication = Number(req.params.idapplication);

    if(req.user.role != 3 && !await fun.checkStudent(idApplication, req.user.id) && !await fun.checkProfessor(idApplication, req.user.id))
        return res.status(401).json({error: "Not Authorized"});
        
    try 
    {
        const result = await pool.query(`SELECT ce.codice AS "foreignCourseCode",
                                          ce.nome AS "foreignCourseTitle",
                                          ce.cfu AS "foreignCourseCFU",
                                          c.codice AS "caFoscariCourseCode",
                                          c.nome AS "caFoscariCourseTitle" ,
                                          c.cfu AS "caFoscariCourseCFU",
                                          m.voto AS "examVote",
                                          m.approvato AS "approved",
                                          TO_CHAR(m.datasostenimento, 'YYYY-MM-DD') AS "examDate",
                                          m.idpratica AS "idApplication"
                                FROM Pratiche p 
                                JOIN Mapping m ON p.idpratica = m.idpratica
                                LEFT JOIN Corsi c ON m.idcorsicafoscari = c.codice
                                LEFT JOIN CorsiEsteri ce ON m.idcorsiesteri = ce.codice
                                WHERE p.idpratica = $1`, [idApplication]);

        return res.status(200).json(result.rows);

    } catch (error) {
        console.error(error);
        res.status(500).json({ error: "Error during the exams mapping extractions" });
    }
});

app.listen(3000, () => {
    console.log("Server avviato su http://localhost:3000");
});

/* --- STUDENTE --- */

// - Resetituisce quantità pratiche aperte/chiuse/in corso
app.get("/api/homestudent/homesummary", fun.verifyToken, async (req, res) =>
{
    if(req.user.role != 1)
        return res.status(401).json({error: "Not Authorized"});

    try 
    {
        const idstudent = req.user.id; // Reperisco id da JWT decodificato

        const totalsApplications =  await pool.query("SELECT COUNT(IdPratica) AS count FROM pratiche WHERE IdStud = $1", [idstudent]);
        const inProgressApplications =  await pool.query("SELECT COUNT(IdPratica) AS count FROM pratiche WHERE IdStud = $1 AND statuspratica != 'Chiusa'", [idstudent]);
        const evaluationApplications =  await pool.query("SELECT COUNT(IdPratica) AS count FROM pratiche WHERE IdStud = $1 AND statuspratica IN ('In attesa di approvazione del Learning Agreement', 'In attesa conferma pre-partenza', 'In riconoscimento esami', 'In attesa conferma Ufficio Overseas')", [idstudent]);
        const closedApplications =  await pool.query("SELECT COUNT(IdPratica) AS count FROM pratiche WHERE IdStud = $1 AND statuspratica = 'Chiusa'", [idstudent]);

        const result =
        {
            "totalsApplications": Number(totalsApplications.rows[0].count),
            "inProgressApplications": Number(inProgressApplications.rows[0].count),
            "evaluationApplications": Number(evaluationApplications.rows[0].count),
            "closedApplications": Number(closedApplications.rows[0].count)
        };
        
        return res.status(200).json(result);

    } catch (error) {
        console.error(error);
        res.status(500).json({ error: "Database Error" });
    }
});

// - Resetituisce elenco pratiche di uno studente
app.get("/api/homestudent/applications", fun.verifyToken, async (req, res) =>
{
    if(req.user.role != 1)
        return res.status(401).json({error: "Not Authorized"});

    try 
    {
        const idstudent = req.user.id; // Reperisco id da JWT decodificato
        
        const applications =  await pool.query(`SELECT p.idpratica AS id,
                                                    p.annoaccademico AS year,
                                                    p.statuspratica AS state,
                                                    ue.nome AS "hostUni",
                                                    ue.citta AS "hostUniCity" ,
                                                    ue.stato AS "hostUniCountry",
                                                    u.nome AS "professorName",
                                                    u.cognome AS "professorSurname",
                                                    u.email AS "professorEmail"
                                            FROM Pratiche p 
                                            LEFT JOIN UniExtraeuropee ue ON p.iduni = ue.iduni
                                            LEFT JOIN Utenti u ON p.iddoc = u.idutente
                                            WHERE p.IdStud = $1
                                            ORDER BY p.idpratica ASC`, [idstudent]);
        
        return res.status(200).json(applications.rows);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: "Database Error" });
    }
});

// - Inserisce nel database il mapping degli esami
app.put("/api/applications/:idapplication/setmapping", fun.verifyToken, async (req, res) => {

    const idApplication = Number(req.params.idapplication);

    if(!await fun.checkStudent(idApplication, req.user.id))
        return res.status(401).json({error: "Not Authorized"});
 
    try 
    {
        const examsMapping = req.body.examsMapping; 

        await pool.query("BEGIN");

        await pool.query(`DELETE FROM Mapping WHERE idpratica = $1`,[idApplication]);

        for (const mapping of examsMapping)
        {
            await pool.query(`INSERT INTO Mapping
                              VALUES ($1, $2, $3)`, [idApplication, mapping.foreignCourseCode, mapping.caFoscariCourseCode]);
        }

        await pool.query(`UPDATE Pratiche SET modificala = $1 WHERE idpratica = $2`, [true, idApplication]);

        await pool.query("COMMIT");

        return res.status(201).send();

    } catch (error) {
        await pool.query("ROLLBACK");
        console.error(error);
        res.status(500).json({ error: "Error during the setting of the mapping of the exams" });
    }
});

// - Inserisce nel database le valutazioni degli esami
app.put("/api/applications/:idapplication/setmapping/votes", fun.verifyToken, async (req, res) => {

    const idApplication = Number(req.params.idapplication);
    const examValues = req.body.examValues;

    if(!await fun.checkStudent(idApplication, req.user.id))
        return res.status(401).json({error: "Not Authorized"});

    try
    {
        await pool.query("BEGIN");
        await pool.query(`DELETE FROM Mapping WHERE idpratica = $1`,[idApplication]);

        // Object.entries(this.examValues) genera un array di due elementi per una coppia "chiave valore"
        for (const [exam, values] of Object.entries(examValues)) {
            const elements = exam.split("_");
            const foreignCourseCode = elements[0];
            const caFoscariCourseCode = elements[1];
            let examDate = null

            if(values.decision)
                examDate = values.date;

            await pool.query(`INSERT INTO Mapping(idpratica, idcorsiesteri, idcorsicafoscari, voto, datasostenimento)
                                VALUES ($1, $2, $3, $4, $5)`, 
                                [idApplication, foreignCourseCode, caFoscariCourseCode, values.vote, examDate]);
        } 

        await pool.query(`UPDATE Pratiche
                          SET statuspratica = 'In riconoscimento esami'
                          WHERE idpratica = $1`, [idApplication]);

        await pool.query("COMMIT");
        return res.status(201).send();

    } catch(error) {
        await pool.query("ROLLBACK");

        if(error.code === 'P0001')
            return res.status(400).json({error: "You must insert departure and arrive date",
                                         code: 'P0001'});
        if(error.code === 'P0002')
            return res.status(400).json({error: "Your dates must be after the arrive date",
                                         code: 'P0002'});
        if(error.code === 'P0003')
            return res.status(400).json({error: "You dates must be before the departure date",
                                         code: 'P0003'});

        res.status(500).json({ error: "Error during the insertion fo the exams votes" });
    }
});

// - Carica il transcripts of records sul server, creando le cartelle necessarie
app.post("/api/applications/:idapplication/uploadtranscriptsofrecords", fun.verifyToken, uploadTranscriptOfRecords.single("uploaded_file"), async (req, res) =>
{
    const idApplication = Number(req.params.idapplication);

    if(!await fun.checkStudent(idApplication, req.user.id))
        return res.status(401).json({error: "Not Authorized"});

    try {
        await pool.query(`UPDATE Pratiche
                            SET transcriptsofrecords = $1
                            WHERE idpratica = $2`, [req.file.originalname, idApplication]);

        return res.status(201).send();

    } catch (error) {

        console.error(error);

        res.status(500).json({
            error: "Error during the file upload"
        });
    }
});

// - Carica il learning agreement sul server, creando le cartelle necessarie
app.post("/api/applications/:idapplication/uploadlearningagreement", fun.verifyToken, uploadLearningAgreement.single("uploaded_file"), async (req, res) =>
{
    const idApplication = Number(req.params.idapplication);

    if(!await fun.checkStudent(idApplication, req.user.id))
        return res.status(401).json({error: "Not Authorized"});

    try {
        await pool.query(`UPDATE Pratiche
                            SET learningagreement = $1,
                            statuspratica = 'In attesa di approvazione del Learning Agreement',
                            modificala = $2,
                            statusla = $3,
                            approvatamodificala = $4
                            WHERE idpratica = $5`, [req.file.originalname, true, null, null, idApplication]);

    return res.status(201).send();

    } catch (error) {

        console.error(error);

        res.status(500).json({
            error: "Error during the file upload"
        });
    }
});

// - Aggiorna il learning agreement sul server
app.put("/api/applications/:idapplication/uploadlearningagreement", fun.verifyToken, uploadLearningAgreement.single("uploaded_file"), async (req, res) =>
{
    const idApplication = Number(req.params.idapplication);
    const applicationStatus = req.body.applicationStatus;

    if(!await fun.checkStudent(idApplication, req.user.id))
        return res.status(401).json({error: "Not Authorized"});
    
    try {
        await pool.query(`UPDATE Pratiche
                            SET learningagreement = $1,
                            statuspratica = $2,
                            modificala = $3,
                            approvatamodificala = $4
                            WHERE idpratica = $5`, [req.file.originalname, applicationStatus, true, null, idApplication]);

    return res.status(200).send();

    } catch (error) {

        console.error(error);

        res.status(500).json({
            error: "Error during the file upload"
        });
    }
});

// - Aggiorna la motivazione della modifica effettuata al learning agreement
app.put("/api/applications/:idapplication/modificationmotivation", fun.verifyToken, async (req, res) =>
{
    const idApplication = Number(req.params.idapplication);
    const modificationText = req.body.modificationText;

    if(!await fun.checkStudent(idApplication, req.user.id))
        return res.status(401).json({error: "Not Authorized"});
    
    try {
        await pool.query(`UPDATE pratiche
                            SET motivazionemodifica = $1
                            WHERE idpratica = $2`, [modificationText, idApplication]);

        return res.status(200).send();

    } catch (error) {

        console.error(error);

        res.status(500).json({
            error: "Error during the save fo motivazionemodifica"
        });
    }
});

// - Inserisce nel database la data di arrivo di uno studente
app.put("/api/applications/:idapplication/uploadarrivedate", fun.verifyToken, async (req, res) =>
{
    const idApplication = Number(req.params.idapplication);

    if(!await fun.checkStudent(idApplication, req.user.id))
        return res.status(401).json({error: "Not Authorized"});


    let arriveDate = req.body.arriveDate;

    if(arriveDate == '')
        arriveDate = null;

        try {
            await pool.query(`UPDATE Pratiche
                                SET dataarrivo = $1
                                WHERE idpratica = $2`, [arriveDate, idApplication]);

            return res.status(200).send();

        } catch (error) {

        console.error(error);

        res.status(500).json({
            error: "Error during the arrive date upload"
        });
    }
});

// - Inserisce nel database la data di partenza di uno studente
app.put("/api/applications/:idapplication/uploaddeparturedate", fun.verifyToken, async (req, res) =>
{
    const idApplication = Number(req.params.idapplication);

    if(!await fun.checkStudent(idApplication, req.user.id))
        return res.status(401).json({error: "Not Authorized"});


    let departureDate = req.body.departureDate;  

    if(departureDate == '')
        departureDate = null;

        try {
            await pool.query(`UPDATE Pratiche
                              SET datapartenza = $1
                              WHERE idpratica = $2`, [departureDate, idApplication]);

            return res.status(200).send();

        } catch (error) {

        console.error(error);

        res.status(500).json({
            error: "Error during the departure date upload"
        });
    }
});

// - Restituisce l'elenco dei corsi della facoltà mappata nella università estera dove va lo studente
app.get("/api/applications/:idapplication/foreigncourses", fun.verifyToken, async (req, res) =>
{

    const idApplication = Number(req.params.idapplication);

    if(!await fun.checkStudent(idApplication, req.user.id))
        return res.status(401).json({error: "Not Authorized"});

    try 
    {
        facultyCode = req.user.faculty;
        
        const result = await pool.query(`
                                SELECT ce.Codice AS code,
                                        ce.Nome AS name,
                                        ce.CFU AS cfu
                                FROM CorsiEsteri ce
                                JOIN InsegnamentiEsteri ie ON ce.Codice = ie.CodCorso
                                JOIN FacoltaEstere fe ON ie.IdFacolta = fe.Codice
                                JOIN OfferteFormative of ON of.IdFacolta = fe.Codice
                                WHERE fe.FacoltaMappata = $1 AND of.IdUni = (
                                                                            SELECT p.iduni
                                                                            FROM Pratiche p
                                                                            WHERE p.idpratica = $2)`, [facultyCode, idApplication]);
        return res.status(200).json(result.rows);
    }
    catch (error) {
        console.error(error);

        res.status(500).json({
            error: "Error during the research of the foreign courses"
        });
    }
});

// - Restituisce l'elenco dei corsi della facoltà mappata nella università ca foscari 
app.get("/api/applications/:idapplication/cafoscaricourses", fun.verifyToken, async (req, res) =>
{
    const idApplication = Number(req.params.idapplication);

    if(!await fun.checkStudent(idApplication, req.user.id))
        return res.status(401).json({error: "Not Authorized"});

    try 
    {
        facultyCode = req.user.faculty;
        const result = await pool.query(`
                                    SELECT c.Codice AS code,
                                            c.Nome AS name,
                                            c.CFU AS cfu
                                    FROM Corsi c
                                    JOIN Insegnamenti i ON c.Codice = i.CodCorso
                                    WHERE i.Facolta =$1`, [facultyCode]);

        return res.status(200).json(result.rows);
    }
    catch (error) {
        console.error(error);

        res.status(500).json({
            error: "Error during the research of the Ca' Foscari courses"
        });
    }
});

// - Prendo i dati da metter nei form della pagina nuova pratica
app.get("/api/homestudent/newapplication/formdata", fun.verifyToken, async (req, res) => {

    if(req.user.role != 1)
        return res.status(401).json({error: "Not Authorized"});

    try {
        const facultyCode = req.user.faculty;

        const universities = await pool.query(`SELECT DISTINCT ue.iduni, 
                                                    ue.nome AS name 
                                                FROM UniExtraeuropee ue
                                                JOIN OfferteFormative of ON ue.iduni = of.iduni
                                                JOIN FacoltaEstere fe ON fe.codice = of.idfacolta
                                                WHERE fe.facoltamappata = $1
                                                ORDER BY ue.nome ASC`, [facultyCode]);

        const professors = await pool.query(`SELECT u.idutente, 
                                                    u.nome AS name, 
                                                    u.cognome AS surname 
                                            FROM utenti u 
                                            WHERE u.ruolo = 2
                                            ORDER BY u.cognome, u.nome ASC`);

        const caFoscariCourses = await pool.query(`SELECT c.codice AS code, 
                                                        c.nome AS name, 
                                                        c.cfu 
                                                    FROM corsi c
                                                    JOIN Insegnamenti i ON i.CodCorso = c.codice
                                                    WHERE i.Facolta = $1`, [facultyCode]);

        const foreignCourses = await pool.query(`SELECT DISTINCT ce.codice AS code, 
                                                            ce.nome AS name, 
                                                            ce.cfu 
                                                    FROM corsiesteri ce
                                                    JOIN InsegnamentiEsteri ie ON ce.codice = ie.codcorso
                                                    JOIN FacoltaEstere fe ON fe.codice = ie.idfacolta
                                                    WHERE fe.FacoltaMappata = $1
                                                    ORDER BY ce.nome ASC`, [facultyCode]);

        return res.status(200).json({
            university: universities.rows,
            professors: professors.rows,
            caFoscariCourses: caFoscariCourses.rows,
            foreignCourses: foreignCourses.rows
        });

    } catch (error) {
        console.error("Error during the research of form data:", error);
        res.status(500).json({ error: "Error during the research of form data" });
    }
});

// - Prendo i dati della pratica esistente da metter nei form della pagina modifica pratica
app.get("/api/applications/:idapplication/previousdetails", fun.verifyToken, async (req, res) => {

    const idApplication = Number(req.params.idapplication);

    if(!await fun.checkStudent(idApplication, req.user.id))
        return res.status(401).json({error: "Not Authorized"});

    try {

        const generalDetails = await pool.query(`SELECT annoaccademico AS "accademicYear", 
                                                periodoprevisto AS "expectedPeriod",
                                                iduni,
                                                iddoc,
                                                notestudente As studentNotes
                                                FROM pratiche 
                                                WHERE idpratica = $1`, [idApplication]);

        if (generalDetails.rows.length === 0) 
            return res.status(404).json({ error: "Application not found" });
        
        const mapping = await pool.query(`SELECT ce.codice AS "foreignCourseCode",
                                                ce.nome AS "foreignCourseTitle",
                                                ce.cfu AS "foreignCourseCFU",
                                                c.codice AS "caFoscariCourseCode",
                                                c.nome AS "caFoscariCourseTitle" ,
                                                c.cfu AS "caFoscariCourseCFU"
                                            FROM Pratiche p 
                                            JOIN Mapping m ON p.idpratica = m.idpratica
                                            LEFT JOIN Corsi c ON m.idcorsicafoscari = c.codice
                                            LEFT JOIN CorsiEsteri ce ON m.idcorsiesteri = ce.codice
                                            WHERE p.idpratica = $1`, [idApplication]);                                       

        const result = {
            ...generalDetails.rows[0],
            mapping: mapping.rows
        };

        return res.status(200).json(result);

    } catch (error) {
        console.error("Error during the research of form data", error);
        res.status(500).json({ error: "Error during the research of form data" });
    }
});

// - Carica la nuova pratica nel database
app.post('/api/homestudent/newapplication/sendApplication', fun.verifyToken, async (req, res) => {

    if(req.user.role != 1)
        return res.status(401).json({error: "Not Authorized"});

    try
    {
        const idstudent = req.user.id;
        const applicationstate = 'Creata';
        const { accademicYear, expectedPeriod, iduni, iddoc, studentNotes, mapping } = req.body;

        await pool.query('BEGIN');
        const newApplication = await pool.query(`INSERT INTO pratiche (annoaccademico, 
                                                                       periodoprevisto, 
                                                                       learningagreement, 
                                                                       notestudente, 
                                                                       statuspratica, 
                                                                       idstud, 
                                                                       iddoc, 
                                                                       iduni,
                                                                       modificala, 
                                                                       statusla,
                                                                       statustor)
                                                VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
                                                RETURNING idpratica`,
                                                [accademicYear, expectedPeriod, null, studentNotes, applicationstate, idstudent, iddoc, iduni, true, null, false]);

        const newApplicationId = newApplication.rows[0].idpratica;

        for(const mappingRow of mapping)
        {
            await pool.query(`INSERT INTO mapping (idpratica, 
                                                   idcorsiesteri,
                                                   idcorsicafoscari)
                                                VALUES ($1, $2, $3)`,[newApplicationId, mappingRow.foreignCourseCode, mappingRow.caFoscariCourseCode]);
        }

        await pool.query('COMMIT');

        return res.status(200).json(newApplication.rows);
    }
    catch (error) 
    {
        await pool.query('ROLLBACK');
        console.error(error);
        res.status(500).json({ error: "Error during the creation of the new application" });
    }
});

// - Carica le modifiche effettuate alla pratica esistente nel database
app.put('/api/applications/:idapplication/modifyApplication', fun.verifyToken, async (req, res) => {

    const idApplication = Number(req.params.idapplication);

    if(!await fun.checkStudent(idApplication, req.user.id))
        return res.status(401).json({error: "Not Authorized"});

    try
    {
        const applicationstate = 'In attesa di approvazione del Learning Agreement';
        const { accademicYear, expectedPeriod, iduni, iddoc, studentNotes } = req.body;

        await pool.query('BEGIN');
        const updatedApplication = await pool.query(`UPDATE pratiche 
                                                     SET annoaccademico = $1, 
                                                         periodoprevisto = $2,  
                                                         notestudente = $3, 
                                                         statuspratica = $4, 
                                                         iddoc = $5, 
                                                         iduni = $6,
                                                         modificala = $7,
                                                         approvatamodificala = $8,
                                                         statusla = $9
                                                     WHERE idpratica = $10`,[accademicYear, expectedPeriod, studentNotes, applicationstate, iddoc, iduni, true, null, null, idApplication]);

        await pool.query('COMMIT');

        return res.status(200).json(updatedApplication.rows);
    }
    catch (error) 
    {
        await pool.query('ROLLBACK');
        console.error(error);
        res.status(500).json({ error: "Error during the modify of the application" });
    }
});

// - COnferma la chiusura della fase in mobilita
app.put('/api/applications/:idapplication/confirmmobilityphase', fun.verifyToken, async (req, res) => {

    const idApplication = req.params.idapplication;
    
    if(!await fun.checkStudent(idApplication, req.user.id))
        return res.status(401).json({error: "Not Authorized"});

    try
    {
        await pool.query(`UPDATE pratiche 
                          SET mobilitaconfermata = $1
                          WHERE idpratica = $2`, [true, idApplication]);

        return res.status(200).send();
    }
    catch (error) 
    {
        console.error(error);
        res.status(500).json({ error: "Error during the confirmation of the mobilty phase" });
    }
});

/* --- PROFESSORE --- */ 

// - Resetituisce quantità pratiche approvate/chiuse/da approvare
app.get("/api/homeprofessor/homesummary", fun.verifyToken, async (req, res) =>
{
    if(req.user.role != 2)
        return res.status(401).json({error: "Not Authorized"});

    try 
    {
        const idprofessor = req.user.id; // Reperisco id da JWT decodificato

        const totalsApplications =  await pool.query("SELECT COUNT(idpratica) AS count FROM pratiche WHERE iddoc = $1", [idprofessor]);
        const inProgressApplications =  await pool.query("SELECT COUNT(idpratica) AS count FROM pratiche WHERE iddoc = $1 AND statuspratica != 'Chiusa'", [idprofessor]);
        const actionRequiredApplications =  await pool.query("SELECT COUNT(idpratica) AS count FROM pratiche WHERE iddoc = $1 AND (statuspratica = 'In attesa di approvazione del Learning Agreement' OR statuspratica = 'In riconoscimento esami')", [idprofessor]);
        const closedApplications =  await pool.query("SELECT COUNT(idpratica) AS count FROM pratiche WHERE iddoc = $1 AND statuspratica = 'Chiusa'", [idprofessor]);

        const result =
        {
            "totalsApplications": Number(totalsApplications.rows[0].count),
            "inProgressApplications": Number(inProgressApplications.rows[0].count),
            "actionRequiredApplications": Number(actionRequiredApplications.rows[0].count),
            "closedApplications": Number(closedApplications.rows[0].count)
        };
        
        return res.status(200).json(result);

    } catch (error) {
        console.error(error);
        res.status(500).json({ error: "Error during the extraction of the home summary" });
    }
});

// - Resetituisce elenco pratiche di un docente
app.get("/api/homeprofessor/applications", fun.verifyToken, async (req, res) =>
{
    if(req.user.role != 2)
        return res.status(401).json({error: "Not Authorized"});

    try 
    {
        const idprofessor = req.user.id; // Reperisco id da JWT decodificato

        const application =  await pool.query(`SELECT p.idpratica AS id,
                                                    p.annoaccademico AS year,
                                                    p.statuspratica AS state,
                                                    ue.nome AS "hostUni",
                                                    ue.citta AS "hostUniCity" ,
                                                    ue.stato AS "hostUniCountry",
                                                    u.nome AS "studentName",
                                                    u.cognome AS "studentSurname",
                                                    u.email AS "studentEmail"
                                            FROM Pratiche p 
                                            LEFT JOIN UniExtraeuropee ue ON p.iduni = ue.iduni
                                            LEFT JOIN Utenti u ON p.idstud = u.idutente
                                            WHERE p.iddoc = $1
                                            ORDER BY p.idpratica ASC`, [idprofessor]);
        
        return res.status(200).json(application.rows);

    } catch (error) {
        console.error(error);
        res.status(500).json({ error: "Error during the extraction of the applications" });
    }
});

// - Aggiorna la pratica in base a se il professore ha deciso di approvare o rifiutare il LA
app.put("/api/applications/:idapplication/la-decision", fun.verifyToken, async (req, res) => {

    const idApplication = Number(req.params.idapplication);

    if(!await fun.checkProfessor(idApplication, req.user.id))
        return res.status(401).json({error: "Not Authorized"});

    try {
        
        const { action, motivation, state } = req.body; // action: 'accept' oppure 'reject'
        
        if (action === 'accept') 
        {
            let newState;
            if(state == 'Creata')
                newState = 'In attesa di approvazione del Learning Agreement';
            else if(state == 'In attesa di approvazione del Learning Agreement')
                newState = 'In attesa conferma pre-partenza';
            else if(state == 'Mobilità in corso')
                newState = 'Mobilità in corso';
            
            await pool.query(`UPDATE Pratiche 
                              SET statusla = $1, 
                                  modificala = $2,
                                  approvatamodificala = $3,
                                  statuspratica = $4,
                                  motivazionerifiutola = $5,
                                  datariscontromodifica = CURRENT_DATE
                              WHERE idpratica = $6`, [true, false, true, newState, null, idApplication]
                            );

            return res.status(200).send();
        } 
        
        if (action === 'reject') {

            await pool.query(`UPDATE Pratiche 
                              SET statusla = $1,
                                  modificala = $2,
                                  approvatamodificala = $3, 
                                  motivazionerifiutola = $4,
                                  statuspratica = $5,
                                  datariscontromodifica = CURRENT_DATE
                              WHERE idpratica = $6`, [false, false, false, motivation, state, idApplication]
                            );
            return res.status(200).send();
        }

        return res.status(400).json({ error: "Invalid action" });

    } catch (error) {
        console.error(error);
        res.status(500).json({ error: "Error during the upload of the LA status" });
    }
});

// - Inserisce nel database il mapping degli esami
app.post("/api/applications/:idapplication/evalutations/setdecisions", fun.verifyToken, async (req, res) => {

    const idApplication = Number(req.params.idapplication);

    if(!await fun.checkProfessor(idApplication, req.user.id))
        return res.status(401).json({error: "Not Authorized"});

    try 
    {
        await pool.query("BEGIN");
        let approved = true;

        await pool.query(`UPDATE Mapping 
                          SET approvato = false
                          WHERE idpratica = $1`, [idApplication]);

        for(const mapping of req.body.data)
        {
            if(mapping.decision < 0)
                approved = false;

            await pool.query(`UPDATE Mapping 
                              SET approvato = $1
                              WHERE idpratica = $2 AND idcorsiesteri = $3 AND idcorsicafoscari = $4`, [approved, idApplication, mapping.foreignCourseCode, mapping.caFoscariCourseCode]);
            approved = true;
        }

        await pool.query(`UPDATE Pratiche
                          SET statuspratica = 'In attesa conferma Ufficio Overseas'
                          WHERE idpratica = $1`, [idApplication]);

        await pool.query("COMMIT");
        return res.status(200).send();

    } catch (error) {
        await pool.query("ROLLBACK");
        console.error(error);
        res.status(500).json({ error: "Error during the setting of the evaluation decisions" });
    }
});

/* --- UFFICIO OVERSEAS --- */

// - Resetituisce quantità pratiche totali/aperte/chiuse per l'ufficio overseas
app.get("/api/homeoffice/homesummary", fun.verifyToken, async (req, res) =>
{
    if(req.user.role != 3)
        return res.status(401).json({error: "Not Authorized"});

    try 
    {
        const totalsApplications =  await pool.query("SELECT COUNT(idpratica) AS count FROM pratiche");
        const inProgressApplications =  await pool.query("SELECT COUNT(idpratica) AS count FROM pratiche WHERE statuspratica != 'Chiusa'");
        const actionRequiredApplications =  await pool.query("SELECT COUNT(idpratica) AS count FROM pratiche WHERE statuspratica = 'In attesa conferma pre-partenza' OR statuspratica = 'In attesa conferma Ufficio Overseas'");
        const closedApplications =  await pool.query("SELECT COUNT(idpratica) AS count FROM pratiche WHERE statuspratica = 'Chiusa'");

        const result =
        {
            "totalsApplications": Number(totalsApplications.rows[0].count),
            "inProgressApplications": Number(inProgressApplications.rows[0].count),
            "actionRequiredApplications": Number(actionRequiredApplications.rows[0].count),
            "closedApplications": Number(closedApplications.rows[0].count)
        };
        
        return res.status(200).json(result);

    } catch (error) {
        console.error(error);
        res.status(500).json({ error: "Error during the extraction of the homesummary" });
    }
});

// - Resetituisce elenco pratiche per ufficio overseas
app.get("/api/homeoffice/applications", fun.verifyToken, async (req, res) =>
{
    if(req.user.role != 3)
        return res.status(401).json({error: "Not Authorized"});

    try 
    {
        const application =  await pool.query(`SELECT p.idpratica AS id,
                                                    p.annoaccademico AS year,
                                                    p.statuspratica AS state,
                                                    ue.nome AS "hostUni",
                                                    ue.citta AS "hostUniCity" ,
                                                    ue.stato AS "hostUniCountry",
                                                    up.nome AS "professorName",
                                                    up.cognome AS "professorSurname",
                                                    up.email AS "professorEmail",
                                                    us.nome AS "studentName",
                                                    us.cognome AS "studentSurname",
                                                    us.email AS "studentEmail"
                                            FROM Pratiche p 
                                            LEFT JOIN UniExtraeuropee ue ON p.iduni = ue.iduni
                                            LEFT JOIN Utenti up ON p.iddoc = up.idutente
                                            LEFT JOIN Utenti us ON p.idstud = us.idutente
                                            ORDER BY p.idpratica ASC`);
        
        return res.status(200).json(application.rows);

    } catch (error) {
        console.error(error);
        res.status(500).json({ error: "Error during the extraction of the application" });
    }
});

// - Aggiorna lo status della pratica quando l'ufficio Overseas comferma la chiusura della pratica o della fase di prepartenza
app.put("/api/applications/:idapplication/confirm-phase", fun.verifyToken, async (req, res) => {

    if(req.user.role != 3)
        return res.status(401).json({error: "Not Authorized"});

    try {
        const idApplication = Number(req.params.idapplication);
        const { action } = req.body; // Chiusura pre-partenza o chiusura pratica

        if (action === 'Pre-Departure phase completed') 
        {
            await pool.query(`UPDATE Pratiche 
                              SET statuspratica = 'Mobilità in corso'
                              WHERE idpratica = $1`, [idApplication]
                            );

            return res.status(200).send();
        } 
        
        if (action === 'Application closed')
        {

            await pool.query(`UPDATE Pratiche 
                              SET statuspratica = 'Chiusa'
                              WHERE idpratica = $1`, [idApplication]
                            );

            return res.status(200).send();
        }

        res.status(400).json({ error: "Invalid Action" });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: "Error during the confirmation phase" });
    }
});