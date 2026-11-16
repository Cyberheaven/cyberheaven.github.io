---
title: "AI in DFIR: A Gift to the Investigator, and to the Attacker"
category: "Tutorials"
date: 2026-11-16
author: "akshay-rajhans"
excerpt: "AI has changed how DFIR investigations are done, for better and for worse. Here is where it actually helps an analyst, where it gets things wrong, and how attackers now use it to fake evidence."
cover: "/media/2026/11/AI-in-DFIR-human-in-the-loop.png"
coverAlt: "Diagram: an AI agent inside a read-only sandbox running forensic tools such as Volatility, Plaso, Zimmerman and Velociraptor, passing its findings (a timeline, IOCs and a draft report) to a human analyst who verifies and approves every conclusion"
tags: ["Artificial Intelligence", "Cybersecurity", "Deepfakes", "DFIR", "Digital Forensics", "Forensic Analysis", "Generative AI", "Incident Response", "LLM", "Prompt Injection"]
draft: false
---

AI has changed how the IT industry works, and nobody is surprised. Software development, data science, offensive security: a good chunk of the grunt work now goes to agents. DFIR got hit too, in ways that help and ways that hurt. This article covers both.

We will also look at what is new in the field, and how you can keep up with it without drowning.

## AI in Digital Forensics

In an investigation, AI shows up in two forms: as an LLM, or as an agent. Neither will find some magic piece of evidence that the usual process would miss. What they can do is take the evidence you found the normal way and work through it **faster**, and *maybe more deeply*, than you can.

### 1. LLMs

A human holds a few sentences in mind at a time. The brain is brilliant at thinking, but give it a few hundred thousand log lines and it slows to a crawl. A frontier LLM has a context window of a million tokens. It reads the whole pile in one pass and looks for patterns across all of it.

So you can dump in the output of Autopsy, Velociraptor, the Zimmerman tools and more, and have it processed in seconds.

![LLM processing forensic tool output](https://i.imghippo.com/files/CjT6513w.png)

### 2. AI agents

An LLM only works with what you hand it. An agent acts. It is an LLM wired up to tools, so it decides what to run, reads the output, and picks the next step by itself.

Give an agent a sandbox holding the evidence and ask it to "find signs of persistence and lateral movement on this machine". It goes through the event logs. It runs Volatility on the memory dump, processes the MFT and registry with MFTECmd and RECmd, and builds a timeline with Plaso. Along the way it chases what looks important and drops what does not, like a human analyst would, minus the fatigue.

### The catch

> **Warning:**
> **Agents make things up.** They will describe, with total confidence, an artifact that does not exist, so every finding gets checked against the raw evidence. No exceptions.
>
> **Evidence integrity** is the next thing to protect. Work on read-only forensic copies and keep the chain of custody intact.
>
> **Prompt injection** is nastier than it sounds. Your evidence is attacker-controlled, so a malicious prompt planted inside it can poison your findings. It can also make the agent do damage to the machine it runs on. Sandbox everything.
>
> **Privacy.** Every case is full of sensitive data, and a hosted model sends all of it to the inference provider. Confirm Zero Data Retention (ZDR) before you upload a single byte.

The approach that works is a **human in the loop**. The agent does the heavy lifting and the analyst signs off on the conclusions.

![Human in the loop workflow](https://i.imghippo.com/files/tut1278K.png)

## Where AI Actually Helps

An investigation is a chain of different jobs. AI is great at some of them and useless at others, so here is where I would use it today.

Start with **triage**. With hundreds of hosts or thousands of alerts, an LLM can rank and summarise so a human looks at the scary ones first. If you only try one thing, try this. A bad ranking costs you a few minutes.

**Timelines** are next. A Plaso timeline can run to millions of rows and nobody reads those top to bottom. An agent can filter, cluster and explain a suspicious window. Ask "what happened in the ten minutes around the first logon from the new IP?" and you have a place to start.

Models are also good with **obfuscated scripts**. Ugly PowerShell, JavaScript droppers and macros get unpacked and explained quickly. What you receive is a hypothesis, though, so run the sample in a sandbox before you believe it. **Correlation** works the same way. Tying a registry key, a prefetch entry and an event log line into one story is pattern matching, which is what LLMs are built for.

And **reporting**, the part everyone dreads. Feed in your notes and tool logs, get a decent first draft, then fix it and put your name on it.

Look at what is missing from that list: acquisition and the final judgement. AI speeds up the middle of the process, where most of the hours disappear. That is all I would trust it with.

## Recent Developments

Until recently, "AI for forensics" meant pasting a log into a chatbot. Now there are projects built for the job, and three stand out.

- **Protocol SIFT:** an experimental open source initiative from SANS. It runs on top of the SIFT Workstation and lets an AI orchestrate the forensic tools, sequence the analysis and log every action. Rob Lee demoed it at \[un\]prompted 2026, with Claude Code connected to SIFT over MCP (Model Context Protocol), running timelines, memory analysis and malware sweeps in plain English. Read the [SANS overview](https://www.sans.org/blog/protocol-sift-experimental-research-initiative-ai-assisted-dfir) or browse the [GitHub repo](https://github.com/teamdfir/protocol-sift).
- **Custom MCP servers:** baseline Protocol SIFT hands the model a shell, which is a bad idea when the evidence is attacker-controlled. Projects like [VERDICT](https://glama.ai/mcp/servers/tejcodes-rex/verdict) fix this with a read-only MCP server that exposes SIFT tools as typed, evidence-safe functions. Full execution logs mean every finding traces back to a real tool run.
- **GenDFIR:** a research framework that pairs Llama 3.1 8B with a RAG (Retrieval Augmented Generation) agent for timeline analysis. A model that small runs locally, and the authors openly say LLMs are still far from reliable enough for investigations. Fair enough. The paper is [here](https://arxiv.org/abs/2409.02572).

Here is a talk that shows the idea in action:

[Watch on YouTube](https://www.youtube.com/watch?v=OsUg3TlAqjQ)

And the whole setup in one picture. The agent never touches a shell. It gets typed, read-only tools, and whatever it finds comes back to the analyst with logs attached.

![AI-assisted DFIR with a read-only MCP server: the analyst asks the LLM agent in plain English, the agent plans and picks tools through an MCP server exposing typed read-only tools inside a read-only boundary, which drives SIFT tools such as Volatility, Plaso and the EZ tools against a read-only forensic copy of the evidence. There is no raw shell access, and findings plus execution logs come back to the analyst, who validates every conclusion](/media/2026/11/AI-in-DFIR-read-only-mcp-flow.png)

## The Other Side: Deepfakes

Everything so far has AI helping the investigator. The attacker has the same toys, and they use them to manufacture evidence instead of finding it.

This is not hypothetical. Voice clones already ring finance teams pretending to be the CEO. In 2024, an employee at Arup in Hong Kong sent around 25 million dollars after a video call where every other face on screen was a deepfake. Fake screenshots, chats and photos are turning up as proof in disputes. So the analyst has a new first question: **is this file even real?**

There is a flip side, and it is just as ugly. Once everyone knows fakes exist, a guilty person can wave away real evidence by calling it AI generated. This is the *liar's dividend*. It means proving a file is genuine now matters as much as proving another one is fake.

### How deepfakes get caught

No single trick works. Detection is layered, and each layer catches what the others miss.

- **Basic file forensics:** the old methods still work, so check metadata, compression traces and editing leftovers first. A real camera sensor also stamps a faint noise pattern (PRNU) on every photo, like a fingerprint. Generated images have none.
- **Pixel artifacts:** classifiers trained on thousands of real and fake samples learn the small mistakes. Blurry edges where a face was pasted on. Mismatched lighting. Strange reflections in the eyes. Frequency-domain patterns left behind by the generator.
- **Signals from a living body:** real faces blink, lips match the words, and skin colour shifts slightly with each heartbeat (rPPG). Fakes usually get at least one of these wrong. Intel's FakeCatcher is built around the heartbeat idea.
- **Audio:** cloned voices leave marks in the spectrogram that your ear will never catch. Models like AASIST are trained to find them, and the ASVspoof challenges are how they get compared.
- **Provenance:** this one flips the problem. Instead of hunting fakes, standards like [C2PA](https://c2pa.org/) (Content Credentials) attach signed information to a file at capture, and watermarks like SynthID mark AI output when it is created. A missing signature proves nothing. A valid one is strong evidence of where the file came from.

### The catch

> **Warning**
> It is an arms race and the detectors are usually a step behind. One trained on a particular generator can fail badly on a newer model it has never met. Upload a video to social media, download it again, and the compression wipes out many of the clues. And the result is only a probability, "87% likely fake", which a court will not accept on its own.
>
> Detectors are AI models too, so everything we said about hallucinations applies. The fix is the same one: **human in the loop**. Treat the score as a lead, then check it against the original file, the metadata, the provenance, and anything else that backs up or breaks the story.

## Will It Stand in Court?

Finding something is half the job. Defending it is the other half, and AI makes that harder.

Start with explainability. If a tool says "this is malicious" and cannot show why, the opposing expert will take it apart in five minutes. That is why the logged, read-only MCP setup from earlier matters: every finding traces back to a real tool run. Reproducibility is the next trap. An LLM can phrase its answer differently on every run, so the underlying artifacts must be reproducible with standard tools, independent of the model.

Then come error rates. In the US, courts judge scientific evidence under the Daubert standard, which looks at testing, peer review and known error rates, and many other jurisdictions ask similar questions. Most AI forensic tools have little published validation, so they would struggle here today. If you do use one, write down the model and version, what you fed it, and what a human verified afterwards.

My rule is simple. AI output is a *lead*, never evidence. The evidence is the artifact.

## A Practical Example: Prompting Matters

Say you ran [Hayabusa](https://github.com/Yamato-Security/hayabusa) on a set of Windows event logs and now have a CSV full of detections. The lazy prompt looks like this:

> Is this machine hacked?

You will get a confident answer, and it will be a guess. Compare it with this:

> You are assisting a DFIR analyst. Below is a Hayabusa CSV. List the detections that suggest persistence or lateral movement. For every claim, quote the exact row (timestamp, Event ID, rule name) it is based on. If the data is not enough to conclude something, say so instead of guessing.

The second prompt narrows the question, so the answer stays on topic. It forces the model to point at raw rows, so you can check each claim yourself. And it allows "not enough data" as an answer, which is the cheapest hallucination fix I know of. Models want to please you. You have to give them an exit.

## Keeping Up With It

The best way to follow this field is to use it. Run the [SIFT Workstation](https://www.sans.org/tools/sift-workstation) in a VM, install Protocol SIFT, and hand it a public case you have already solved by hand. Then watch what it finds, what it misses, and where it starts inventing things. You can also feed the output of [Hayabusa](https://github.com/Yamato-Security/hayabusa) or [Plaso](https://github.com/log2timeline/plaso) to an LLM for a quick summary. To catch new projects, search the SANS blog and arXiv ("digital forensics LLM" works well).

### Before You Point AI at a Case

1. Am I on a read-only copy, with the original hash recorded?
2. Is the model local, or does my provider guarantee zero data retention?
3. Is the agent sandboxed, with no open shell or network access?
4. Can I trace every finding back to a raw artifact and check it myself?
5. Did I log the model, prompts and outputs for the report?

The analysts who get the most out of agents will be the ones who already understand the artifacts, because they can tell when the agent is wrong. So learn the fundamentals first. Then let the agents help you cover more ground.
