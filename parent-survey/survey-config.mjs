import {ACTIVE_QUESTIONS as QUESTIONS} from './questions.mjs?v=20261031.10';
export const DEFAULT_SCHOOL='مدرسه ی دانش';
export const GRADES=['هفتم','هشتم','نهم'];
export const QUESTION_CODES=QUESTIONS.map(q=>q.code);
// Older drafts used all 15 questions; resume at the same remaining question.
export function restoreSurveyStep(step,previousCodes){
  if(!Number.isInteger(step)||step<0)return -1;
  const previous=Array.isArray(previousCodes)?previousCodes:Array.from({length:15},(_,i)=>'P'+String(i+1).padStart(2,'0'));
  const next=previous.slice(step).find(code=>QUESTION_CODES.includes(code));
  return next?QUESTION_CODES.indexOf(next):QUESTIONS.length;
}
