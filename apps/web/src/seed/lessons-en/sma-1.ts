import { doc, h2, p, ul } from '../lexical'
import { type EnLesson, qe, SMA } from './types'

const check = [h2('Final check (10 minutes)'), p('Do the practice below.')]

export const EN_SMA_1: Record<string, EnLesson> = {
  [`${SMA}:1`]: {
    objective: 'Students map the role of AI in a field of work they are interested in and take a pre-test that measures their starting AI literacy.',
    content: doc(
      h2('Opening (10 minutes)'),
      p('Students write down one field of work or university major they are interested in. The teacher asks: "How might AI change that work over the next ten years?"'),
      h2('Concept: AI and the world of work (15 minutes)'),
      p('AI is already used in many fields: in health to help read test results, in agriculture to monitor crops, in finance to detect suspicious transactions, and in marketing to analyse trends. In most fields, AI changes the way work is done by taking over certain tasks, while people still set goals, judge results and take responsibility for decisions.'),
      ul(
        'Tasks AI tends to help with: processing large amounts of data, making drafts and recognising patterns.',
        'Tasks that still need people: judging context, empathy, negotiation and ethical decisions.',
        'Skills that matter more and more: checking AI output, using AI effectively and keeping integrity.',
      ),
      h2('Activity: AI map for your chosen field and pre-test (40 minutes)'),
      p('For 15 minutes, students in groups by field build a simple map: which tasks in that field AI can help with and which tasks remain with people. For the next 25 minutes, students take the pre-test on their own. It does not count towards report grades.'),
      h2('Reflection (15 minutes)'),
      p('Students write one AI-related skill they want to master by the end of the program. The teacher keeps these for the last session.'),
      h2('Final check (10 minutes)'),
      p('The practice below has sample questions from each big idea.'),
    ),
    quiz: [
      qe('Which best describes a generative AI system?', ['A system that only stores data', 'A system that creates new content, such as text or images, based on patterns in its training data', 'A system that calculates with fixed formulas', 'A system that runs without electricity'], 'Generative AI produces new content by predicting patterns similar to the data it learned from.'),
      qe('A fraud-detection AI more often wrongly flags transactions from a particular region. What is the best first step?', ['Stop all transactions from that region', 'Check whether the training data represents transactions from that region well', 'Ignore the mistakes', 'Blame users from that region'], 'Patterned mistakes for a particular group often come from unbalanced training data.'),
      qe('You want AI to help make a study plan for an exam. Which instruction is best?', ['"Make a schedule."', '"Create a two-week study schedule for a grade 11 Physics exam, one hour a day, with practice questions at the end of each week."', '"Help me."', '"Physics is hard."'], 'A good instruction states the goal, context, limits and the form of the result you want.'),
      qe('Which practice best protects personal data when using AI services?', ['Uploading a photo of your ID card so the AI can fill in a form', 'Using example data, then filling in real details yourself outside the AI service', 'Sharing your password so the AI can log into your account', 'Writing your full address in every question'], 'Real personal data should not be entered into AI services unless it is truly necessary and safe.'),
      qe('A small business wants to use AI to answer customer questions. Which decision should stay with a person?', ['Greeting customers', 'Approving refunds or handling serious complaints', 'Telling customers the opening hours', 'Sending the price list'], 'Decisions with a big impact on customers should be checked and made by people.'),
    ],
  },
  [`${SMA}:2`]: {
    objective: 'Students can assess what data apps and AI services collect, and set personal rules to protect their data and digital footprint.',
    content: doc(
      h2('Opening (10 minutes)'),
      p('The teacher asks: "If someone collected all your posts, searches and conversations for a year, what could they learn about you?" Students write three answers.'),
      h2('Concept: Digital footprint and personal data (15 minutes)'),
      p('A digital footprint is the record of online activity, both what is shared deliberately, such as posts, and what is collected automatically, such as location, search history and conversations with AI services. Indonesia’s Law No. 27 of 2022 on Personal Data Protection gives data owners rights, including to know how their data is used, to request a copy and to request deletion.'),
      ul(
        'General personal data: name, address, phone number, date of birth, photos.',
        'Specific personal data: health, biometrics, personal finances, children’s data.',
        'Data that is often forgotten: location, phone contacts, chatbot conversation history.',
      ),
      h2('Activity: App audit and data shield (40 minutes)'),
      p('Students choose two apps they use often, including one AI service. They check the app permissions on their phone and read the part of the privacy policy about data collected and stored. They record the results in a table: data collected, reason given, and settings that can be changed. Then students use the data shield simulator to test their decisions about sharing information.'),
      h2('Reflection (15 minutes)'),
      p('Each student writes five personal rules about data they will not share with AI services and one privacy setting they will change today.'),
      ...check,
    ),
    quiz: [
      qe('Which is a digital footprint that is collected automatically?', ['A photo deliberately posted to social media', 'Location history recorded by a map app', 'A handwritten letter', 'A notebook in your bag'], 'Many apps record data such as location without the user deliberately posting anything.'),
      qe('Under the Personal Data Protection Law, which right does a data owner have?', ['The right to see other people’s personal data', 'The right to request deletion of their personal data', 'The right to sell a friend’s data', 'No rights at all'], 'Data owners have rights including knowing how their data is used, requesting a copy and requesting deletion.'),
      qe('A torch app asks for access to your contacts and location. The best action is…', ['Grant every permission so the app runs smoothly', 'Refuse permissions unrelated to what the app does, or find another app', 'Share the app with all your friends', 'Ignore the request without reading it'], 'Permissions should match what the app does. A torch app does not need contacts or location.'),
    ],
  },
  [`${SMA}:3`]: {
    objective: 'Students can group AI systems by function, explain how recommendation algorithms shape the information people see, and name the limits of AI.',
    content: doc(
      h2('Opening (10 minutes)'),
      p('The teacher shows five digital tools: a calculator, an email spam filter, video recommendations, a chatbot and an automatic translator. Students guess which use AI and what each one does.'),
      h2('Concept: Three ways digital systems work (15 minutes)'),
      ul(
        'Rule-based: follows fixed instructions written by people, such as a calculator.',
        'Predictive: estimates a label or number from patterns in data, such as spam filters and price estimates.',
        'Generative: creates new content such as text, images or audio, such as chatbots and image generators.',
      ),
      p('Recommendation algorithms are predictive systems: they estimate which content will keep users watching or buying. As a result, users may keep seeing similar content. AI also has limits: it does not understand meaning the way people do, may not know about recent events, and has no moral responsibility.'),
      h2('Activity: Classification and feed analysis (40 minutes)'),
      p('In groups, students sort ten digital tool cards into the three types above and explain why. Then they compare the home feeds of their video or social media apps, note similarities in content, and discuss who benefits from the way the recommendations work.'),
      h2('Reflection (15 minutes)'),
      p('The class discusses: which decisions must not be handed entirely to AI, and why? Examples: grading students, hiring and health diagnoses.'),
      ...check,
    ),
    quiz: [
      qe('What type of system is an email spam filter?', ['Rule-based only', 'Predictive, because it estimates whether an email is spam based on patterns', 'Generative, because it creates new emails', 'Not a digital system'], 'A spam filter estimates the label "spam" or "not spam" from patterns learned from many example emails.'),
      qe('Why can a social media feed keep showing someone similar opinions?', ['Because everyone has the same opinions', 'Because the recommendation algorithm prioritises content similar to what was liked before', 'Because the app is broken', 'Because users cannot search for other content'], 'Recommendations that follow user habits can narrow the range of information people see.'),
      qe('Which decision is least suitable to hand entirely to AI?', ['Ordering songs in a playlist', 'Deciding whether a job applicant is hired', 'Correcting spelling in a draft', 'Suggesting a travel route'], 'Decisions with a big impact on someone’s life need human judgement and responsibility.'),
    ],
  },
  [`${SMA}:6`]: {
    objective: 'Students can explain how a model is trained, the difference between training and test data, and how data quality affects predictions.',
    content: doc(
      h2('Opening (10 minutes)'),
      p('The teacher asks: "If you study for an exam only by memorising the answers to practice questions, what happens when the exam questions are different?" This question leads into the idea of a model that only memorises its data.'),
      h2('Concept: Training, testing and prediction (15 minutes)'),
      ul(
        'Training data: labelled examples the model uses to find patterns.',
        'Test data: separate examples not seen during training, used to measure whether the model really works on new data.',
        'Prediction: the model’s estimate for new data, usually with a confidence level.',
        'Overfitting: the model fits the training data too closely and fails on new data, like a student who only memorises.',
      ),
      p('Prediction quality depends on the amount, variety and label accuracy of the data. Wrong labels are taught to the model as if they were true.'),
      h2('Activity: Training a simple classifier (40 minutes)'),
      p('Students use the data trainer simulator to train a model that tells two kinds of object apart. They run three experiments: little data, lots of uniform data, and lots of varied data, then test the model on the test data provided and record its accuracy. The last experiment deliberately includes some wrong labels to see their effect.'),
      h2('Reflection (15 minutes)'),
      p('Groups present their results and explain which experiment gave the best accuracy on the test data, and why.'),
      ...check,
    ),
    quiz: [
      qe('Why must test data be kept separate from training data?', ['So training is faster', 'So you can measure whether the model works well on data it has never seen', 'Because test data is not important', 'So the model memorises more data'], 'Separate test data shows the model’s ability in new situations, not just memorisation.'),
      qe('A model is very accurate on training data but poor on test data. What is the likely problem?', ['The model is overfitting', 'The test data has too few colours', 'The computer is too fast', 'The model is already perfect'], 'Overfitting happens when a model fits the training data too closely and fails to generalise.'),
      qe('What is the effect of wrong labels in training data?', ['No effect', 'The model learns wrong patterns, so its predictions can be wrong', 'The model becomes more accurate', 'The model fixes the labels by itself'], 'A model treats labels as the truth. Wrong labels teach wrong patterns.'),
    ],
  },
}
