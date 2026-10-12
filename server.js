import 'dotenv/config';
import express from 'express';
const app=express();

app.post('/api/token', async (_req,res)=>{
  const apiKey=process.env.REACTOR_API_KEY?.trim();
  if(!apiKey||apiKey==='rk_your_key_here'){
    return res.status(500).json({error:'REACTOR_API_KEY is missing from the local .env file.'});
  }

  try{
    const response=await fetch('https://api.reactor.inc/tokens',{
      method:'POST',
      headers:{'Reactor-API-Key':apiKey},
    });
    const body=await response.json().catch(()=>({error:'Reactor returned an invalid response.'}));
    if(!response.ok)return res.status(response.status).json(body);
    if(!body.jwt)return res.status(502).json({error:'Reactor token response did not include a JWT.'});
    res.json({jwt:body.jwt});
  }catch(error){
    console.error('Reactor token request failed:',error instanceof Error?error.message:error);
    res.status(502).json({error:'Unable to reach Reactor right now.'});
  }
});

const server=app.listen(process.env.PORT||3001,()=>console.log(`Reactor token server: http://localhost:${process.env.PORT||3001}`));
server.on('error',error=>console.error('Reactor token server error:',error));
server.ref();
