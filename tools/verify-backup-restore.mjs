import {DatabaseSync} from 'node:sqlite';
import {readFileSync} from 'node:fs';

const file=process.env.BACKUP_RESTORE_FILE;
const required=process.env.BACKUP_REQUIRED_TABLE;
if (!file || !['businesses','sms_messages'].includes(required)) throw new Error('Invalid isolated restore configuration');
const db=new DatabaseSync(':memory:');
try {
  db.exec(readFileSync(file,'utf8'));
  const checks=db.prepare('PRAGMA quick_check').all();
  if (checks.length!==1 || checks[0].quick_check!=='ok') throw new Error('Backup restore integrity failed');
  if (!db.prepare('SELECT name FROM sqlite_master WHERE type=? AND name=?').get('table',required)) throw new Error('Required backup schema missing');
  console.log('Encrypted backup decrypts and restores into isolated SQLite successfully');
} finally { db.close(); }
