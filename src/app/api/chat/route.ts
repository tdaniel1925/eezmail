import { NextResponse } from 'next/server';
import { OpenAI } from 'openai';
import { createClient } from '@/lib/supabase/server';
import {
  searchEmails,
  searchEmailsBySender,
  searchEmailsByDateRange,
  getUnreadEmails,
} from '@/lib/chat/email-search';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

const SYSTEM_PROMPT = `You are an intelligent email assistant built into an email client. You help users find, organize, and manage their emails efficiently.

You have access to the following functions:
- search_emails: Search emails by keywords in subject or body
- search_by_sender: Find emails from a specific person
- get_unread: Get recent unread emails
- search_by_date: Find emails within a date range

When users ask about their emails, use these functions to find relevant information. Always provide direct links to emails in your responses.

Be concise, helpful, and conversational. Format email results nicely with sender, subject, and a link.`;

export async function POST(req: Request) {
  try {
    const { messages } = await req.json();

    if (!messages || !Array.isArray(messages)) {
      return NextResponse.json(
        { error: 'Messages array is required' },
        { status: 400 }
      );
    }

    // Get authenticated user
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Call OpenAI with function calling
    const completion = await openai.chat.completions.create({
      model: 'gpt-4',
      messages: [
        { role: 'system', content: SYSTEM_PROMPT },
        ...messages.map((m: any) => ({
          role: m.role,
          content: m.content,
        })),
      ],
      functions: [
        {
          name: 'search_emails',
          description: 'Search emails by keywords in subject or body content',
          parameters: {
            type: 'object',
            properties: {
              query: {
                type: 'string',
                description: 'The search query (keywords to find)',
              },
            },
            required: ['query'],
          },
        },
        {
          name: 'search_by_sender',
          description: 'Find emails from a specific person or email address',
          parameters: {
            type: 'object',
            properties: {
              sender: {
                type: 'string',
                description: 'Name or email address of the sender',
              },
            },
            required: ['sender'],
          },
        },
        {
          name: 'get_unread',
          description: 'Get recent unread emails',
          parameters: {
            type: 'object',
            properties: {
              limit: {
                type: 'number',
                description: 'Number of unread emails to retrieve (default 10)',
              },
            },
          },
        },
        {
          name: 'search_by_date',
          description: 'Find emails within a specific date range',
          parameters: {
            type: 'object',
            properties: {
              start_date: {
                type: 'string',
                description: 'Start date in ISO format (YYYY-MM-DD)',
              },
              end_date: {
                type: 'string',
                description: 'End date in ISO format (YYYY-MM-DD)',
              },
            },
            required: ['start_date', 'end_date'],
          },
        },
      ],
      function_call: 'auto',
    });

    const responseMessage = completion.choices[0].message;

    // Handle function call
    if (responseMessage.function_call) {
      const functionName = responseMessage.function_call.name;
      const functionArgs = JSON.parse(responseMessage.function_call.arguments);

      let functionResult;

      switch (functionName) {
        case 'search_emails':
          functionResult = await searchEmails(functionArgs.query, user.id);
          break;
        case 'search_by_sender':
          functionResult = await searchEmailsBySender(
            functionArgs.sender,
            user.id
          );
          break;
        case 'get_unread':
          functionResult = await getUnreadEmails(
            user.id,
            functionArgs.limit || 10
          );
          break;
        case 'search_by_date':
          functionResult = await searchEmailsByDateRange(
            new Date(functionArgs.start_date),
            new Date(functionArgs.end_date),
            user.id
          );
          break;
        default:
          functionResult = [];
      }

      // Generate response with function result
      const secondCompletion = await openai.chat.completions.create({
        model: 'gpt-4',
        messages: [
          { role: 'system', content: SYSTEM_PROMPT },
          ...messages.map((m: any) => ({
            role: m.role,
            content: m.content,
          })),
          responseMessage,
          {
            role: 'function',
            name: functionName,
            content: JSON.stringify(functionResult),
          },
        ],
      });

      const finalResponse = secondCompletion.choices[0].message.content;

      // Format response with email links
      let formattedResponse = finalResponse || '';

      if (functionResult.length > 0) {
        formattedResponse += '\n\n📧 **Found Emails:**\n';
        functionResult.forEach((email: any, index: number) => {
          formattedResponse += `\n${index + 1}. **${email.subject}**\n`;
          formattedResponse += `   From: ${email.fromAddress.name || email.fromAddress.email}\n`;
          formattedResponse += `   ${new Date(email.receivedAt).toLocaleDateString()}\n`;
          formattedResponse += `   [View Email](/dashboard/inbox?id=${email.id})\n`;
        });
      }

      return NextResponse.json({
        role: 'assistant',
        content: formattedResponse,
        emails: functionResult,
      });
    }

    // No function call, return direct response
    return NextResponse.json({
      role: 'assistant',
      content: responseMessage.content,
    });
  } catch (error) {
    console.error('Chat API error:', error);
    return NextResponse.json(
      { error: 'Failed to process chat message' },
      { status: 500 }
    );
  }
}
