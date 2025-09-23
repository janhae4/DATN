import { Injectable } from '@nestjs/common';
import imaps from 'imap-simple';
import { simpleParser } from 'mailparser';

@Injectable()
export class EmailServiceService {
  private readonly config = {
    imap: {
      user: 'nguyennguyen8343@gmail.com',
      password: 'ailt bmyi heug yjky', 
      host: 'imap.gmail.com',
      port: 993,
      tls: true,
      tlsOptions: { rejectUnauthorized: false },
      authTimeout: 3000,
    },
  };

  async fetchUnreadMails() {
    const connection = await imaps.connect(this.config);
    await connection.openBox('INBOX');

    const searchCriteria = ['UNSEEN'];
    const fetchOptions = { bodies: ['HEADER', 'TEXT'], markSeen: true };

    const messages = await connection.search(searchCriteria, fetchOptions);

    const results: Array<{ from?: string; subject?: string | null; text?: string | null }> = [];

    for (const message of messages) {
      const all = message.parts.find((part) => part.which === 'TEXT');
      if (!all) continue;

      const parsed = await simpleParser(all.body);

      const item = {
        from: parsed.from?.text,
        subject: parsed.subject ?? null,
        text: parsed.text ?? null,
      };

      console.log('From:', item.from);
      console.log('Subject:', item.subject);
      console.log('Body:', item.text);

      results.push(item);
    }

    await connection.end();
    return results;
  }
}
