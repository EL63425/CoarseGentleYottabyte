const express=require('express');const multer=require('multer');const sharp=require('sharp');const crypto=require('crypto');const app=express();let imageStore={};const SECRET_KEY=process.env.secret;function generateMediumSafeKey(){const array=new Uint8Array(16);return crypto.randomBytes(16).toString('hex')}
function generateSecretKey(){return crypto.randomBytes(16).toString('hex')}
const EXPIRATION_TIME=10000;sharp.concurrency(4);const storage=multer.memoryStorage();const upload=multer({storage:storage});app.post('/upload',upload.single('file'),async(req,res)=>{const secret=req.query.secret;if(secret!==SECRET_KEY){return res.status(403).send('Forbidden: Invalid secret.')}
if(!req.file){return res.status(400).send('No file uploaded.')}
const accessKey=generateMediumSafeKey();const secretKey=generateSecretKey();try{const imageBuffer=await sharp(req.file.buffer).jpeg({quality:70,progressive:!0}).toBuffer();imageStore[accessKey]={imageBuffer,secretKey,expirationTime:Date.now()+EXPIRATION_TIME,};const imageUrl=`https://${req.headers.host}/images/${accessKey}?secret=${secretKey}`;res.send(`<html>
                <body>
                  <a href="${imageUrl}">${imageUrl}</a></p>
                </body>
              </html>`)}catch(err){console.error('Error during image compression: ',err);res.status(500).send('Error compressing image.')}});app.get('/images/:accessKey',async(req,res)=>{const{accessKey}=req.params;const{secret}=req.query;const imageData=imageStore[accessKey];if(imageData){if(Date.now()>imageData.expirationTime){delete imageStore[accessKey];return res.status(410).send('This page has expired.')}
if(imageData.secretKey===secret){res.contentType('image/jpeg');return res.send(imageData.imageBuffer)}}
res.status(403).send('Forbidden: Invalid access key.')});setInterval(()=>{const now=Date.now();Object.keys(imageStore).forEach((accessKey)=>{if(imageStore[accessKey].expirationTime<now){console.log(`Cleaning up expired image: ${accessKey}`);delete imageStore[accessKey]}})},60000);app.listen(3000,()=>{console.log('Server running on http://localhost:3000')})
