// Francesco Simeoni - Alessandro Marchiorato | PROGETTO TAW | A.A 2025/2026

const argon2 = require("argon2");
const jwt = require('jsonwebtoken');
const pool = require("./database");

// Per generare hash della password
async function hashPassword(password)
{
    return await argon2.hash(password);
}

// Per confrontare password inserita con hash nel database
async function verifyPassword(password_hash, password)
{
    try
    {
        return await argon2.verify(password_hash, password);
    }
    catch (error)
    {
       return false;
    }
}

// Per veriricare che il JWT esista e non sia manomesso
function verifyToken(req, res, next) {

    // Estraggo il token
    const token = req.cookies.token;
    
    try {
        // Qui avviene il controllo della firma con i dati del token
        const payload = jwt.verify(
            token,
            process.env.JWT_SECRET
        );
        
        req.user = payload;
        next();

    } catch (error) {

        return res.status(401).json({
            error: 'Invalid token'
        });
    }
}

// Controlla che lo studente non abbia modificato "idapplication" sull'url
async function checkStudent(idapplication, idstudent)
{
    if(idstudent)
    {
        const result = await pool.query(`SELECT 1
                                        FROM pratiche WHERE idpratica=$1 AND idstud=$2`,[idapplication, idstudent]);
        
        return result.rows.length > 0;
    }
    return false;
}

// Controlla che il professore non abbia modificato "idapplication" sull'url
async function checkProfessor(idapplication, idprofessor)
{
    if(idprofessor)
    {
        const result = await pool.query(`SELECT 1
                                        FROM pratiche WHERE idpratica=$1 AND iddoc=$2`,[idapplication, idprofessor]);
    
        return result.rows.length > 0;
    }
    return false;
}

module.exports = {
    hashPassword,
    verifyPassword,
    verifyToken,
    checkStudent,
    checkProfessor
}