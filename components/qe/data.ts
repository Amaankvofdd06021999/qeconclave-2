export const tracks=[
{number:'01',name:'Agentic AI in QE',short:'Autonomous systems. Human confidence.',description:'Explore AI agents that reason, act and learn—and the quality engineering practices that keep them reliable.',tags:['Agent evaluation','Autonomous testing','Guardrails']},
{number:'02',name:'AI for QE',short:'A new intelligence for quality.',description:'Discover AI-powered testing, automation innovations and modern practices that improve engineering excellence.',tags:['Test generation','Self-healing systems','Intelligent automation']},
{number:'03',name:'QE for AI',short:'Trust is an engineering discipline.',description:'Examine AI assurance, responsible AI, model evaluation and governance across enterprise AI systems.',tags:['Model evaluation','AI assurance','Responsible AI']},
{number:'04',name:'Quality Intelligence',short:'From signals to better decisions.',description:'Connect observability, quality metrics and engineering insights to measurable business outcomes.',tags:['AI observability','Quality signals','Enterprise AI']},
{number:'05',name:'QE Leadership',short:'Lead the next era of engineering.',description:'Shape enterprise quality strategies, modernize engineering practices and build teams ready for the next chapter.',tags:['Quality culture','Transformation','Engineering leadership']}
];
export const partners=[['QualiZeal','qualizeal-color'],['Tricentis','tricentis-color'],['TestMu AI','testmu-color'],['BrowserStack','browserstack-color'],['pCloudy','pcloudy-color'],['Testsigma','testsigma'],['Digital.ai','digitalai-color'],['Synthesized','synth-color'],['QApilot','qapilot-color'],['Context AI','ctx-color']];
export const editions=[
{year:'2025',title:'Beyond Assurance',subtitle:'Engineering Trust in the Age of AI',date:'28 November 2025',venue:'HICC, Hyderabad',image:'event-0.webp',intro:'Quality Engineering’s brilliant minds, powerful voices, and industry-shaping conversations came together to explore how we assure trust in AI-enabled systems.',names:['Jyoti Rai','Ankit Gupta','Madhu Murty','Aditya Challa','Avinash Tiwari','Mukund Wangikar','Ansul Jindal','Sanket Mali','Kavita Bhanwadia','Shiva Kumar RV','Jitendra Putcha','Anurup Gaurav','Melanie Pais']},
{year:'2024',title:'AI-Powered Quality Engineering',subtitle:'A Vision for 2025 and Beyond',date:'22 November 2024',venue:'Trident, Hyderabad',image:'dsc05147.webp',intro:'An in-person gathering of quality leaders and practitioners exploring the integration of GenAI with QE capabilities, through practical demonstrations, keynotes and panel conversations.',names:['Divya Madaan','Sreedhar Gade','Parth Singh','Madhu Murty','Meghana Jagadeesh','Sudhir Joshi','Narain Muralidharan','Anuradha Amudalapalli','Ravi Daparthi','Anita K. Manda','Jeyachitra Alagar','Anurup Gaurav','Baijnath Pandey']},
{year:'2023',title:'The Future of Quality Engineering',subtitle:'Navigating 2024 and Beyond',date:'15 December 2023',venue:'AVASA, Hyderabad',image:'archive-2023-20.webp',intro:'The first QE Conclave brought together eminent thought leaders, expert practitioners and industry luminaries to explore disruptive innovations and emerging trends shaping the future of quality engineering.',names:['Santanu Paul','Manisha Saboo','Raj Neravati','Kalilur Rahman','Madhu Murty','LRV Ramana','Ravi Lakkaraju','Ashwin Palaparthi','Parvathi Palagummi']}
];
// 2026 partner tiers as published on qeconclave.com. Empty slots render as open "your logo here" invitations.
export type Sponsor={name:string,logo:string,url:string};
export const sponsorTiers:{key:string,label:string,slots:number,sponsors:Sponsor[]}[]=[
{key:'title',label:'Title partner',slots:2,sponsors:[{name:'QualiZeal',logo:'qualizeal-color',url:'https://qualizeal.com/'}]},
{key:'platinum',label:'Platinum partners',slots:2,sponsors:[]},
{key:'gold',label:'Gold partners',slots:4,sponsors:[]},
{key:'exhibit',label:'Exhibit partners',slots:4,sponsors:[]}
];
