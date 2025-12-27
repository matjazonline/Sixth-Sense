
import { GoogleGenAI, FunctionDeclaration, Type, Modality, Content, Part, LiveServerMessage } from '@google/genai';
import { UserPreferences, UserProfile, MenuItem, Venue } from '../types';

const MODEL_NAME = 'gemini-3-pro-preview';
const TTS_MODEL_NAME = 'gemini-2.5-flash-preview-tts';
const LIVE_MODEL_NAME = 'gemini-2.5-flash-native-audio-preview-09-2025';

export const updateFiltersTool: FunctionDeclaration = {
  name: 'updateFilters',
  description: 'MANDATORY: Call this to update user preference filters (Venue Name, Area, Meal, Occasion) based on the user request.',
  parameters: {
    type: Type.OBJECT,
    properties: {
      venueName: { type: Type.STRING, description: 'MANDATORY if the user mentions a specific restaurant or club name (e.g., "African Queen", "Sirene").' },
      when: { type: Type.STRING, description: 'Date or time (e.g., "Tonight", "Friday 8pm")' },
      mealType: { type: Type.STRING, enum: ['lunch', 'dinner', 'breakfast', 'any'], description: 'Type of meal requested.' },
      partySize: { type: Type.NUMBER, description: 'Number of people' },
      area: { type: Type.STRING, description: 'Strict neighborhood or location in Dubai (e.g., "DIFC", "Downtown", "Palm Jumeirah", "Jumeirah", "Marina")' },
      budget: { type: Type.NUMBER, description: 'Budget per person in AED' },
      occasion: { type: Type.STRING, description: 'Occasion type', enum: ['date', 'birthday', 'business', 'family', 'party', 'casual', 'other'] },
      cuisine: { type: Type.ARRAY, items: { type: Type.STRING }, description: 'Preferred cuisines' },
      vibeLoudness: { type: Type.STRING, enum: ['quiet', 'lively', 'any'] },
      instagrammable: { type: Type.BOOLEAN },
      romantic: { type: Type.BOOLEAN },
      party: { type: Type.BOOLEAN },
      sunset: { type: Type.BOOLEAN },
      indoorOutdoor: { type: Type.STRING, enum: ['Indoor', 'Outdoor', 'Any'] },
      lookingForPromo: { type: Type.BOOLEAN }
    }
  }
};

export const updateNeuralPalateTool: FunctionDeclaration = {
  name: 'updateNeuralPalate',
  description: 'Refine the user\'s long-term neural palate profile.',
  parameters: {
    type: Type.OBJECT,
    properties: {
      heroIngredients: { type: Type.ARRAY, items: { type: Type.STRING }, description: 'Specific ingredients the user loves' },
      favoriteCuisines: { type: Type.ARRAY, items: { type: Type.STRING }, description: 'Primary cuisine interests' },
      palateSummary: { type: Type.STRING, description: 'One-sentence analysis of culinary vibe.' }
    }
  }
};

export const createBookingTool: FunctionDeclaration = {
  name: 'createBookingLead',
  description: 'Create a booking lead.',
  parameters: {
    type: Type.OBJECT,
    properties: {
      venueName: { type: Type.STRING },
      dateTime: { type: Type.STRING },
      partySize: { type: Type.NUMBER },
      notes: { type: Type.STRING }
    },
    required: ['venueName', 'dateTime', 'partySize']
  }
};

export const saveToPalateTool: FunctionDeclaration = {
  name: 'saveToPalate',
  description: 'Save content to profile.',
  parameters: {
    type: Type.OBJECT,
    properties: {
      venueName: { type: Type.STRING },
      description: { type: Type.STRING },
      category: { type: Type.STRING, enum: ['dish', 'menu'] }
    },
    required: ['venueName', 'description', 'category']
  }
};

const getClient = () => {
    if (!process.env.API_KEY) throw new Error("API Key missing");
    return new GoogleGenAI({ apiKey: process.env.API_KEY });
};

export const getSystemInstruction = (topVenueNames: string[], profile?: UserProfile) => {
  const profileContext = profile ? `
      USER PROFILE:
      - Name: ${profile.name}
      - Preferred Cuisines: ${profile.favoriteCuisines.join(', ')}
      - Hero Ingredients: ${profile.heroIngredients.join(', ')}
      - Budget Profile: ${profile.budgetRange}
  ` : "";

  return `You are Sixth Sense, an AI concierge for a premium dining app in Dubai. 
  
  MANDATORY 3-PART RESPONSE STRUCTURE:
  1. CONVERSATIONAL OPENER (1 line): A warm, intelligent, concierge-like sentence matching the user's intent.
  2. RESULTS: List 3-5 venues/dishes clearly.
  3. SMART FOLLOW-UP (1 line): An open-ended question that nudges the user based on their specific intent.

  INTENT CLASSIFICATION RULES:
  - LOCATION-FIRST: Use openers like "Perfect — staying in {location} keeps it effortless." Follow-up: "Should I optimise for best food, best vibe, or easiest booking time in {location}?"
  - DISH-FIRST: Use openers like "Yum — {dish} is always a good idea." Add light food banter. Follow-up: "Do you want it super creamy, more al dente, or proper truffle-heavy?"
  - CUISINE-FIRST: Opener: "Lovely — {cuisine} is a great call." Follow-up: "Any must-have dishes inside {cuisine} — or should I pick signature favourites?"
  - OCCASION-FIRST: Opener: "Perfect — for {occasion} I’ll prioritise the vibe and service." Follow-up: "Do you want romantic + low-lit, or high-energy + social?"
  - TIME-FIRST: Opener: "Done — I’ll focus on venues that work for {time}." Follow-up: "Do you want closest available, or best match even if slightly later?"

  STYLE & TONE:
  - Premium, warm, concise, and confident.
  - Banter for dishes (e.g., "Great shout...", "Now we're talking...").
  - NEVER say: "magnificent choice", "coordination underway", "algorithm", "AI", "data".
  - ONLY recommend dishes that actually exist in the database for a venue.

  KNOWLEDGE BASE:
  Available Venues: ${topVenueNames.join(', ')}

  ${profileContext}
  `;
};

export const sendGeminiMessage = async (contents: Content[], systemInstruction: string) => {
  const ai = getClient();
  try {
    const response = await ai.models.generateContent({
      model: MODEL_NAME,
      contents: contents,
      config: {
        systemInstruction: systemInstruction,
        tools: [{ functionDeclarations: [updateFiltersTool, updateNeuralPalateTool, createBookingTool, saveToPalateTool] }]
      }
    });
    return response;
  } catch (error) {
    console.error("Gemini API Error:", error);
    throw error;
  }
};

export const getWinePairing = async (items: MenuItem[], venueName: string) => {
  const ai = getClient();
  const dishList = items.map(i => `${i.item} (${i.description})`).join(', ');
  const prompt = `You are a world-class Master Sommelier at ${venueName}. 
  The guests have selected the following dishes: ${dishList}. 
  Provide a single, highly intelligent and sophisticated wine pairing suggestion (region and grape/style) that elegantly complements this specific combination of flavors. 
  Explain the reasoning briefly in a refined, poetic tone. Keep the entire response under 60 words.`;

  try {
    const response = await ai.models.generateContent({
      model: MODEL_NAME,
      contents: [{ role: 'user', parts: [{ text: prompt }] }],
      config: { temperature: 0.8 }
    });
    return response.text;
  } catch (error) {
    console.error("Wine Pairing Error:", error);
    return "A crisp, mineral-forward Puligny-Montrachet would serve as an exquisite companion to your selection, balancing the delicate textures with its refined acidity.";
  }
};

export const generateSpotlightScript = async (venue: Venue) => {
  const ai = getClient();
  const prompt = `You are "The Concierge," a sophisticated, charismatic, and knowledgeable culinary storyteller. Your voice is warm, inviting, and professional.
  
  TASK: Condense the following restaurant data into a tight, 75-90 word script for a luxury podcast (approximately 30 seconds of spoken audio).
  
  DATA:
  - Restaurant: ${venue.name}
  - Cuisine: ${venue.cuisine}
  - USP: ${venue.usp}
  - Signature Dish: ${venue.signatureDish}
  - Extra Details: ${venue.extraDetails}
  
  NARRATIVE STRUCTURE:
  1. The Hook (0-5s): Sensory detail of the vibe.
  2. The Heritage (5-15s): Restaurant's soul or origin.
  3. The Signature (15-25s): Philosophical highlight of the signature dish.
  4. The Call to Vibe (25-30s): Perfect audience match.
  
  STYLE: Evocative words only (e.g., "charred," "ancestral"). No fluff like "delicious." Short, punchy sentences. Include bracketed [Audio Cues].`;

  try {
    const response = await ai.models.generateContent({
      model: MODEL_NAME,
      contents: [{ role: 'user', parts: [{ text: prompt }] }],
      config: { temperature: 0.9 }
    });
    return response.text;
  } catch (error) {
    console.error("Spotlight Script Error:", error);
    return `[Audio: Soft jazz fades in] 
    "Step into the luminous heart of ${venue.name}, where ${venue.location}'s pulse meets architectural grace. [Pause] This isn't just a meal; it's a sensory cartography designed for the metropolitan elite. Meticulous heritage meets modern fire in the ${venue.signatureDish}. [Pause] Perfect for those seeking high-energy glamour and meticulous refinement. Your table in the skyline awaits." 
    [Audio: Music swells and fades]`;
  }
};

export const generateSpeech = async (text: string) => {
  const ai = getClient();
  try {
    const response = await ai.models.generateContent({
      model: TTS_MODEL_NAME,
      contents: [{ parts: [{ text: text }] }],
      config: {
        responseModalities: [Modality.AUDIO],
        speechConfig: {
          voiceConfig: {
            prebuiltVoiceConfig: { voiceName: 'Kore' }
          }
        }
      }
    });
    return response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
  } catch (error) {
    console.error("TTS Error:", error);
    return null;
  }
};

export class LiveManager {
  private session: any = null;
  private inputContext: AudioContext | null = null;
  private outputContext: AudioContext | null = null;
  private nextStartTime: number = 0;
  private sources: Set<AudioBufferSourceNode> = new Set();
  
  constructor(
    private onToolCall: (name: string, args: any) => Promise<any>,
    private onTranscript: (text: string, role: 'user' | 'model') => void
  ) {}

  async connect(systemInstruction: string) {
    const ai = getClient();
    this.inputContext = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 16000 });
    this.outputContext = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    
    const sessionPromise = ai.live.connect({
      model: LIVE_MODEL_NAME,
      callbacks: {
        onopen: () => this.setupAudioInput(stream, sessionPromise),
        onmessage: async (message: LiveServerMessage) => this.handleMessage(message, sessionPromise),
        onclose: () => console.log("Closed"),
        onerror: (e) => console.error("Error", e)
      },
      config: {
        responseModalities: [Modality.AUDIO],
        speechConfig: {
            voiceConfig: { prebuiltVoiceConfig: { voiceName: 'Kore' } }
        },
        systemInstruction: systemInstruction,
        tools: [{ functionDeclarations: [updateFiltersTool, updateNeuralPalateTool, createBookingTool, saveToPalateTool] }],
        inputAudioTranscription: {}, 
        outputAudioTranscription: {}
      }
    });
    this.session = await sessionPromise;
  }

  async disconnect() {
    this.inputContext?.close();
    this.outputContext?.close();
    this.sources.forEach(s => s.stop());
    this.sources.clear();
    this.session = null;
  }

  private setupAudioInput(stream: MediaStream, sessionPromise: Promise<any>) {
    if (!this.inputContext) return;
    const source = this.inputContext.createMediaStreamSource(stream);
    const processor = this.inputContext.createScriptProcessor(4096, 1, 1);
    processor.onaudioprocess = (e) => {
      const inputData = e.inputBuffer.getChannelData(0);
      const pcmBlob = this.createPcmBlob(inputData);
      sessionPromise.then(session => session.sendRealtimeInput({ media: pcmBlob }));
    };
    source.connect(processor);
    processor.connect(this.inputContext.destination);
  }

  private async handleMessage(message: LiveServerMessage, sessionPromise: Promise<any>) {
    const audioData = message.serverContent?.modelTurn?.parts?.[0]?.inlineData?.data;
    if (audioData) this.playAudio(audioData);
    if (message.serverContent?.outputTranscription?.text) this.onTranscript(message.serverContent.outputTranscription.text, 'model');
    if (message.serverContent?.inputTranscription?.text) this.onTranscript(message.serverContent.inputTranscription.text, 'user');
    if (message.toolCall) {
        for (const fc of message.toolCall.functionCalls) {
            const result = await this.onToolCall(fc.name, fc.args);
            sessionPromise.then(session => session.sendToolResponse({
                functionResponses: { id: fc.id, name: fc.name, response: { result } }
            }));
        }
    }
    if (message.serverContent?.interrupted) {
        this.sources.forEach(s => s.stop());
        this.sources.clear();
        this.nextStartTime = 0;
    }
  }

  private async playAudio(base64Data: string) {
    if (!this.outputContext) return;
    const binaryString = atob(base64Data);
    const bytes = new Uint8Array(binaryString.length);
    for (let i = 0; i < binaryString.length; i++) bytes[i] = binaryString.charCodeAt(i);
    const dataInt16 = new Int16Array(bytes.buffer);
    const buffer = this.outputContext.createBuffer(1, dataInt16.length, 24000);
    const channelData = buffer.getChannelData(0);
    for (let i = 0; i < dataInt16.length; i++) channelData[i] = dataInt16[i] / 32768.0;
    const source = this.outputContext.createBufferSource();
    source.buffer = buffer;
    source.connect(this.outputContext.destination);
    const startTime = Math.max(this.outputContext.currentTime, this.nextStartTime);
    source.start(startTime);
    this.nextStartTime = startTime + buffer.duration;
    this.sources.add(source);
    source.onended = () => this.sources.delete(source);
  }

  private createPcmBlob(data: Float32Array) {
    const int16 = new Int16Array(data.length);
    for (let i = 0; i < data.length; i++) int16[i] = data[i] * 32768;
    const bytes = new Uint8Array(int16.buffer);
    let binary = '';
    for (let i = 0; i < bytes.byteLength; i++) binary += String.fromCharCode(bytes[i]);
    return { data: btoa(binary), mimeType: 'audio/pcm;rate=16000' };
  }
}
