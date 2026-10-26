THE BURDEN OF CONVENIENCE: EXPLORING GUILT IN THE AGE OF ARTIFICIAL INTELLIGENCE
________________________________________________________________
PROJECT DESCRIPTION
True Prompt is a critical design project that mimics a conventional AI chatbot to expose the often-hidden costs associated with generative AI use. Rather than functioning as a qualitative research tool, the website serves as a proof of concept for a six-dimensional framework of AI guilt, demonstrating how its dimensions intersect, interact, and compound.

The project challenges the tendency to frame AI guilt primarily through concerns surrounding authorship (Chan, 2024, p. 1), instead positioning it as a multidimensional concept encompassing ethical, political, social, environmental, economic, and authorship-related concerns.

Built using the Gemini API, True Prompt allows prompts to be submitted and AI-generated responses to be produced. Before each response is generated, the interface reveals estimated costs across the six dimensions of AI guilt. Each dimension presents the option to cancel or continue, allowing the process to be terminated at any stage or continued until a response is generated.

If a prompt is cancelled, a receipt records the estimated costs accumulated up to that point. Once a response is generated, an itemised receipt displays the estimated costs associated with the prompt. At the end of a session, a cumulative summary consolidates the costs associated with all submitted prompts.

The central design decision behind True Prompt is the use of a familiar chatbot interface to make the broader implications of generative AI more visible. Inspired by nutritional labelling, the itemised receipt presents information that might otherwise remain obscured. By bringing the six dimensions into a single interface, True Prompt uses critical design to challenge authorship-centred understandings of AI guilt and demonstrate the interconnected nature of its wider implications.
________________________________________________________________
FEATURES
- AI chatbot: Submit prompts and receive AI-generated responses through the Gemini API.
- Cost disclosure: View estimated costs across six dimensions of AI guilt before a response is generated.
- Cancel or continue: Choose whether to proceed at each stage of the cost disclosure process.
- Itemised receipts: Review the estimated costs associated with individual prompts, including prompts cancelled before completion.
- Session summary: View a cumulative summary of the estimated costs associated with prompts submitted during a session.
________________________________________________________________
TECHNOLOGIES USED
React
Vite
JavaScript (JSX)
Google Gemini API
________________________________________________________________
SETUP AND INSTALLATION
PREREQUISITES
Before running the project, ensure the following are installed:
- Node.js and npm
- A code editor, such as Visual Studio Code
- A valid Google Gemini API key

Installation
1. Open the project folder in your preferred code editor.
2. Open a terminal in the project directory.
3. Install the project dependencies:
   npm install
4. Locate the .env.example file in the project root directory.
5. Create a copy of this file and name it .env, ensuring it is in the same directory as package.json. This will contain the API key
________________________________________________________________
RUNNING THE PROJECT
Once the dependencies are installed and the environment variables are configured, start the development server:
npm run dev
The terminal will display a local URL, typically http://localhost:5173/.
Open this URL in your browser to access True Prompt.
To stop the development server, press Ctrl + C in the terminal.
________________________________________________________________
USAGE
1. Open True Prompt in your browser.
2. Enter a prompt into the chatbot interface and submit it.
3. Review the estimated costs presented across the six dimensions of AI guilt.
4. Choose to cancel or continue at each stage of the disclosure process.
5. If the prompt is completed, review the generated response and its itemised cost receipt.
6. Submit additional prompts to explore their associated costs.
7. End the session to view a cumulative summary of the estimated costs associated with the session.
________________________________________________________________
PROJECT SCOPE
True Prompt is a critical design project and proof of concept developed to explore and communicate a multidimensional framework of AI guilt. It is not intended to function as a qualitative research tool or to produce empirical findings about human behaviour.

The costs displayed by the interface are estimates informed by the project's underlying assumptions and calculation methods. They should be interpreted as part of the project's critical design framework rather than as definitive measurements of the full societal impact of generative AI.


