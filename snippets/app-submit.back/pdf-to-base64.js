const fs = require('fs')

const pdf = fs.readFileSync('./resume.pdf')

const base64 = pdf.toString('base64')

console.log(base64)
