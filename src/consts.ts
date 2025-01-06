export const API_KEY: string = 'AIzaSyBnyicy0HcBwtWYEsnbFbgbL4Yvnr43bKw';

export const PNG_TO_JSON_PROMPT = `I want to convert this png file to json format. The question should be question and not include asterisk. The blue background one is the main info and below that is question answers. I want it in this format
{  
  main: "the blue background text"  
  info: [
    {  
      questions: "question1",  
      answer: ["answer"]  
    }
    ...  
  ]  
}
If there are more than one answers comma separated then add each answer separately instead of in one answer. The check box answers should be a separate entity in answers. 
`;
