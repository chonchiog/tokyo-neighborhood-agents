# Sub-agent model policy

When launching any sub-agent, explicitly set the sub-agent `model` to match the current main session model unless the user asks for a different model.

Rules:

- Do not rely on sub-agent default models.
- If the current session is using `gpt-5.4`, launch sub-agents with `model: "gpt-5.4"`.
- If the current session is using another model, use that exact model ID for sub-agents.
- Only choose a different sub-agent model when the user explicitly asks for a cheaper, faster, or different model.

This applies to built-in sub-agents (`explore`, `task`, `general-purpose`, `code-review`) and custom repository agents.
