import { NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';

interface ChatRequest {
  message: string;
}

export async function POST(req: Request) {
  const apiKey = "AIzaSyD_AM1vtBozbFogrkUUoviWmljs78KBLkI";

  if (!apiKey) {
    console.error('API Key is missing');
    return new NextResponse(JSON.stringify({ error: 'GEMINI_API_KEY is missing' }), { status: 500 });
  }

  const { message }: ChatRequest = await req.json();

  const genAI = new GoogleGenerativeAI(apiKey);
  const modelName = "gemini-1.5-flash";

  const generationConfig = {
    temperature: 0.5,
    top_p: 0.95,
    top_k: 10,
    max_output_tokens: 8192,
    response_mime_type: 'text/plain',
  };

  const model = genAI.getGenerativeModel({ model: modelName, generationConfig });

  const systemMessage = `
    You are an AI assistant helping a user interact with a blockchain for loan contract interaction.
    Just return me the response in json dont give any other description
    The user can perform the following actions:
    - "Request loan [amount]": Call the "requestLoan" function with the amount in ETH.
    {
      "functionName": "requestLoan",
      "parameters": { "amount": 0.001 , "description": "Some description" , "loanType": 0(personal) or 1(business) or 2(student) , "duration": 1}
    }
  `;

  const prompt = `${systemMessage} ${message}`;

  try {
    const result = await model.generateContent(prompt);
    const botResponse = result.response.text();
    console.log(botResponse)

    try {
      const cleanedResponse = botResponse
        .replace(/```json/g, '')
        .replace(/```/g, '');

      const responseData = JSON.parse(cleanedResponse);
      console.log(responseData)
      // return new NextResponse(JSON)

      if (responseData.functionName) {
        if (
          ['requestLoan'].includes(responseData.functionName)
        ) {
          return NextResponse.json(responseData);
        } else if (responseData.functionName === 'generic') {
          return NextResponse.json(responseData);
        } else {
          return new NextResponse(JSON.stringify({ error: "Invalid function name" }), { status: 400 });
        }
      } else {
        return new NextResponse(JSON.stringify({ error: "Unable to process that request" }), { status: 400 });
      }
    } catch (err) {
      console.error('Error processing AI response:', err);
      return new NextResponse(JSON.stringify({ error: 'Invalid response format from AI' }), { status: 500 });
    }
  } catch (error) {
    console.error('Error generating content:', error);
    return new NextResponse(JSON.stringify({ error: 'Internal Server Error' }), { status: 500 });
  }
}