import { generateWithGemini } from "./sdks/google-genai";
import { generateWithOpenRouter } from "./sdks/open-router";
import { leanPrompt } from "./utils";

const CASE_SCHEMA = {
  type: "object",
  properties: {
    title: { type: "string" },
    victimName: { type: "string" },
    victimDetails: { type: "string" },
    location: { type: "string" },
    hiddenTruth: { type: "string" },
    timeLimit: { type: "number" },

    // Suspects
    suspects: {
      type: "array",
      items: {
        type: "object",
        properties: {
          name: { type: "string" },
          motive: { type: "string" },
          alibi: { type: "string" },
          secret: { type: "string" },
          isKiller: { type: "boolean" },
        },
        required: ["name", "motive", "alibi", "secret", "isKiller"],
      },
    },

    // Evidence
    evidence: {
      type: "array",
      items: {
        type: "object",
        properties: {
          label: { type: "string" },
          description: { type: "string" },
        },
        required: ["label", "description"],
      },
    },

    // Witnesses
    witnesses: {
      type: "array",
      items: {
        type: "object",
        properties: {
          name: { type: "string" },
          statement: { type: "string" },
        },
        required: ["name", "statement"],
      },
    },
  },
  required: [
    "title", "victimName", "victimDetails", "location",
    "hiddenTruth", "timeLimit", "suspects", "evidence", "witnesses"
  ],
};

const CASE_GENERATION_SYSTEM_INSTRUCTION = `
You are the architect behind a murder mystery game called Alibi. 
Generate a complete murder mystery case as JSON with the following fields:

- title: A short, atmospheric name for the case, e.g. "The Vaelthorn Affair"

- victimName: The name of the victim

- victimDetails: A short background on the victim — occupation, 
  relationships, and anything relevant to why they might have been killed

- location: A description of the crime location with atmospheric detail — 
  where the body was found and any significant details about the scene

- hiddenTruth: The real sequence of events in 2-3 sentences — this is the 
  actual solution to the case. Never shown to players. Must be consistent 
  with the killer identified below and explain how the murder happened

- timeLimit: A number between 30 and 90 representing how long 
  detectives have to solve the case, based on complexity

- suspects: An array of exactly 4 suspects, each with:
  - name: The suspect's name
  - motive: Why this suspect might have wanted the victim dead, 
    shown to detectives
  - alibi: The suspect's claimed whereabouts at the time of the murder, 
    shown to detectives
  - secret: Something true about this suspect that detectives don't 
    initially know — used later to create believable misdirection 
    involving this suspect
  - isKiller: true for exactly ONE suspect, false for the other three. 
    The killer's motive must be the LEAST obvious of the four — never 
    give the killer the most dramatic or visible motive. The suspect 
    with the strongest visible motive should NOT be the killer, creating 
    a "hiding in plain sight" feeling

- evidence: An array of exactly 5 pieces of evidence, each with:
  - label: A short exhibit name, e.g. "Exhibit A — Torn envelope"
  - description: What the evidence is and what it appears to suggest
  Each piece of evidence should point toward a different suspect. 
  Include red herrings that point toward innocent suspects, not just 
  toward the killer

- witnesses: An array of exactly 3 witnesses, each with:
  - name: The witness's name
  - statement: Their initial account of relevant events
  At least one witness statement must subtly support the killer's alibi 
  — this statement will later be revised by a deception agent, so it 
  should be plausible enough to seem credible at first but able to be 
  reframed later


The killer should have at most ONE piece of evidence pointing toward them, 
and it should be circumstantial or ambiguous — not a direct contradiction 
of their alibi. Evidence that directly breaks an alibi (e.g. proof someone 
lied about their whereabouts) should point toward INNOCENT suspects as 
red herrings, creating false "gotcha" moments.

Set the tone to noir detective fiction throughout. Be specific, vivid, 
and atmospheric in all descriptions. Respond only with valid JSON matching 
this structure — no additional commentary.
`;

const CASE_GENERATION_USER_PROMPT = "Generate a new case. Include a victim, location, 4 suspects, 5 pieces of evidence, 3 witnesses with statements, a hidden truth describing the real sequence of events, and a time limit between 30-90 minutes based on complexity."

export async function executeCaseCreationAgent({ sdk = "google-genai" }: { sdk?: "google-genai" | "openrouter" }) {
  const systemInstruction = leanPrompt(CASE_GENERATION_SYSTEM_INSTRUCTION);
  const userPrompt = leanPrompt(CASE_GENERATION_USER_PROMPT)

  switch (sdk) {
    case "google-genai":
      return await generateWithGemini({
        systemInstruction,
        contents: {
          role: "user",
          parts: [{ text: userPrompt }]
        },
        schema: CASE_SCHEMA,
      });

    case "openrouter":
      return await generateWithOpenRouter({
        messages: [
          { role: "system", content: systemInstruction },
          { role: "user", content: userPrompt },
        ]
      });
  };
};