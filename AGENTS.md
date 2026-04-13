# Sub-agent model policy

When launching any sub-agent, explicitly set the sub-agent `model` to match the current main session model unless the user asks for a different model.

Also preserve the main session's reasoning tier/effort when that is available. If the main session is using a higher reasoning mode such as `xhigh`, sub-agents should use the same level whenever the launcher supports it.

Rules:

- Do not rely on sub-agent default models.
- If the current session is using `gpt-5.4`, launch sub-agents with `model: "gpt-5.4"`.
- If the current session is using another model, use that exact model ID for sub-agents.
- If the current session is using a higher reasoning tier (for example `xhigh`), preserve that same reasoning tier for sub-agents whenever supported.
- If the launcher does not expose a separate reasoning-effort control, keep the exact same model ID and do not silently downgrade reasoning behavior when there is a known limitation.
- Only choose a different sub-agent model when the user explicitly asks for a cheaper, faster, or different model.

This applies to built-in sub-agents (`explore`, `task`, `general-purpose`, `code-review`) and custom repository agents.
