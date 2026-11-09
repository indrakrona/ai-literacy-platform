import { doc, h2, p, ul } from '../lexical'
import { type EnLesson, qe, SMA } from './types'

const check = [h2('Final check (10 minutes)'), p('Do the practice below.')]

export const EN_SMA_2: Record<string, EnLesson> = {
  [`${SMA}:7`]: {
    objective: 'Students can trace the cause of an AI mistake to the data, the system design or the way it was used, and suggest fixes.',
    content: doc(
      h2('Opening (10 minutes)'),
      p('The teacher presents three made-up news stories about AI mistakes: a translator that misreads a regional term, an app that misjudges a product photo, and a chatbot that gives advice unsuitable for the user’s age. Students guess the cause of each.'),
      h2('Concept: Three sources of mistakes (15 minutes)'),
      ul(
        'Data: training data that is too little, unbalanced, out of date or wrongly labelled.',
        'Design: the system’s goal is wrong, for example chasing clicks without regard for quality, or there are no safety checks.',
        'Use: the system is used for a purpose it was not designed for, or the user gives ambiguous instructions.',
      ),
      p('Knowing the source matters because the fixes differ: data mistakes are fixed with better data, design mistakes by changing goals and safeguards, and use mistakes with rules and user training.'),
      h2('Activity: Investigation in the AI Lab (40 minutes)'),
      p('Groups receive three cases. For each case, they try to reproduce a similar mistake in the AI Lab, record evidence, decide the most likely source, and write one fix for developers and one for users.'),
      h2('Reflection (15 minutes)'),
      p('Groups respond to each other’s findings. The class discusses who is responsible when AI makes a mistake: the developer, the service provider or the user.'),
      ...check,
    ),
    quiz: [
      qe('An automatic translator misreads a term from a regional language. The most likely source of the mistake is…', ['The user typed too fast', 'The training data contains little of that regional language', 'The phone screen is too small', 'The term has no meaning'], 'Languages that rarely appear in training data tend to be translated less accurately.'),
      qe('A video app is designed to maximise watch time, so it often recommends sensational content. This is a mistake in…', ['Data', 'The design of the system’s goal', 'Hardware', 'Internet connection'], 'A goal that only chases watch time can drive unhealthy recommendations. That is a design problem.'),
      qe('Someone uses a general chatbot to decide a medicine dose. Why is this risky?', ['Because the chatbot cannot write numbers', 'Because the system is used for a purpose that needs a health worker and checks a chatbot cannot do', 'Because medicines have no doses', 'Because chatbots only work at night'], 'Using AI outside its safe purpose is a use mistake. Medical decisions need health workers.'),
    ],
  },
  [`${SMA}:8`]: {
    objective: 'Students can judge the reliability of AI answers using sources and evidence, and recognise signs of deepfake content.',
    content: doc(
      h2('Opening (10 minutes)'),
      p('The teacher shows two video clips or images, one real and one made with AI, without saying which is which. Students choose and explain their reasons.'),
      h2('Concept: Verification and deepfakes (15 minutes)'),
      p('AI answers should be treated as drafts that must be checked. A deepfake is an image, video or audio clip made or altered with AI so it looks real. Deepfakes can be used for fraud, for example imitating a family member’s voice to ask for a money transfer.'),
      ul(
        'Check the source: who made this information, and is there an official source saying the same?',
        'Find comparisons: do other trusted media or institutions report the same thing?',
        'Look at details: hands, background text, lighting, lip movement and unnatural voices.',
        'Use reverse image search to find where a photo first came from.',
        'For requests for money by voice or message, contact the person through a number you already know.',
      ),
      h2('Activity: Verification challenge (40 minutes)'),
      p('Groups receive five claims: two from AI answers, two from social media posts and one audio clip. They verify each claim with the steps above, then judge it: true, false or not yet confirmed, with evidence.'),
      h2('Reflection (15 minutes)'),
      p('The class writes a short "Check Before You Share" guide for families, including how to deal with suspicious voice messages.'),
      ...check,
    ),
    quiz: [
      qe('You receive a voice message that sounds like your older sibling, asking for an urgent money transfer. What should you do?', ['Transfer the money immediately', 'Contact your sibling through a number you already know to confirm', 'Reply with your bank account number', 'Forward the message to the family group'], 'Voices can be imitated with AI. Always confirm through a channel you know before acting.'),
      qe('Which verification step is strongest for a claim about government policy?', ['Looking at the number of likes on the post', 'Checking the official website of the relevant ministry or agency', 'Asking an AI whether the claim is true', 'Trusting the post that has been shared most'], 'Official sources are the main reference for policy information.'),
      qe('Reverse image search is useful for…', ['Making an image bigger', 'Finding where a photo first appeared and its original context', 'Changing an image’s colours', 'Creating new images with AI'], 'Reverse image search helps you find when and where a photo first appeared.'),
    ],
  },
  [`${SMA}:9`]: {
    objective: 'Students can design instructions with a role, limits and examples, improve them step by step, and use AI as a work partner without handing over their thinking.',
    content: doc(
      h2('Opening (10 minutes)'),
      p('The teacher shows two instructions for the same task and their results: one short instruction and one complete instruction. Students discuss what made the second result more useful.'),
      h2('Concept: Advanced prompting techniques (15 minutes)'),
      ul(
        'Role: "Act as the editor of the school magazine."',
        'Goal and context: what you want to achieve, for whom and in what situation.',
        'Limits: length, style, things to avoid.',
        'Example: give one example of the result you want.',
        'Iteration: improve the instruction based on the result, one change at a time.',
      ),
      p('Using AI as a work partner means students still set the goal, check the results and note the reason for each decision. These process notes show the student’s own thinking.'),
      h2('Activity: Team prompting challenge (40 minutes)'),
      p('Each team gets the same task, for example writing a school event announcement for three different audiences. Teams have three chances to improve their instruction in the AI Lab and must note each change and the reason for it. The final results are judged together on accuracy, clarity and fit for the audience.'),
      h2('Reflection (15 minutes)'),
      p('Teams share the instruction change that improved the result most. The class builds an instruction template to use for schoolwork.'),
      ...check,
    ),
    quiz: [
      qe('Which instruction includes a role, a goal and limits?', ['"Write an announcement."', '"As a student council member, write an announcement for a cleanliness competition for grade 10 students in 80 words, in formal language."', '"Cleanliness competition."', '"Please make something interesting."'], 'This instruction states a role (student council member), the goal, audience, length and style.'),
      qe('The AI result is nearly right but the language is too casual. The best improvement is…', ['Rewrite the whole instruction from scratch', 'Add one limit: "Use formal language."', 'Give up and write it yourself without AI', 'Repeat the same instruction'], 'Effective iteration changes one thing at a time so the effect is clear.'),
      qe('Why is it important to note the reason for each change to an instruction?', ['So the AI works faster', 'To show your own thinking and make the next improvement easier', 'Because the app requires it', 'So the AI result gets longer'], 'Process notes show the student’s role in the work and help them learn from each attempt.'),
    ],
  },
  [`${SMA}:11`]: {
    objective: 'Students can build a simple prototype with AI help, such as a chatbot, campaign or tool, and document the process and the role AI played.',
    content: doc(
      h2('Opening (10 minutes)'),
      p('The teacher shows examples of student prototypes: a library information chatbot, an energy-saving campaign poster and an automated worksheet. Students choose the kind of prototype they will make.'),
      h2('Concept: From idea to prototype (15 minutes)'),
      ul(
        'Decide the user and the problem: who will use it and what does it help with?',
        'Design the main flow or content before using AI.',
        'Use AI to speed up making it, then check and adjust the result.',
        'Test with one user and improve based on feedback.',
        'Document it: which parts AI made, which parts you made, and how the result was checked.',
      ),
      p('SMK students make prototypes for their own study programme, for example a guest information assistant for hospitality or an engine inspection guide for automotive engineering.'),
      h2('Activity: Building session (40 minutes)'),
      p('In teams, students build their prototype using the AI Lab and available tools, then test it with a member of another team. Each team fills in a process documentation sheet.'),
      h2('Reflection (15 minutes)'),
      p('Teams present their prototype in two minutes and explain one important decision they made themselves, not the AI.'),
      ...check,
    ),
    quiz: [
      qe('What should you do before asking AI to create the content of a prototype?', ['Ask the AI to make everything straight away', 'Decide the user, the problem and the main flow of the prototype', 'Choose the app’s colours', 'Collect as much personal data from users as possible'], 'Designing the goal and flow first makes the use of AI more focused.'),
      qe('Why does a prototype need testing with users?', ['So it looks more professional', 'To find problems its makers cannot see', 'Because AI cannot make prototypes', 'So users pay'], 'Testing with users reveals confusion and gaps that need fixing.'),
      qe('Good process documentation includes…', ['Only the final result', 'Which parts AI made, which parts you made, and how the result was checked', 'The AI account password', 'A list of favourite apps'], 'Documentation shows honesty about AI’s role and the quality of the checks carried out.'),
    ],
  },
}
