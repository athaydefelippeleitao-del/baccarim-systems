import OpenAI from 'openai';
import dotenv from 'dotenv';
dotenv.config();

const openai = new OpenAI({ apiKey: process.env.VITE_OPENAI_API_KEY });

async function test() {
  try {
    const file = await openai.files.create({
      file: new File(['hello world'], 'test.pdf', { type: 'application/pdf' }),
      purpose: 'user_data'
    });
    console.log('File uploaded:', file.id);

    const res = await openai.chat.completions.create({
      model: 'gpt-4o',
      messages: [{
        role: 'user',
        content: [
          { type: 'text', text: 'what is this?' },
          { type: 'file', file: { file_id: file.id } } as any
        ]
      }]
    });
    console.log(JSON.stringify(res, null, 2));
  } catch(e) {
    console.error((e as any).message);
  }
}
test();
