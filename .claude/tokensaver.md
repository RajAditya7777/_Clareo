# TokenSaver Pattern Requirements

To maximize context memory and reduce unnecessary overhead while pair-programming with AI, the Clariyo project enforces the **TokenSaver** pattern.

## 1. Code Optimization
*   **No Code Comments:** All code files (`.ts`, `.py`) must have minimal or zero comments. Let the code speak for itself through clear variable names and robust typing. 
*   **Separation of Concerns:** Move all architectural explanations, edge cases, and rationale into the `md/` documentation folders. The compiler does not need to read your essays.

## 2. Documentation Rules
*   Every source code change triggers an update to its specific `.md` file. 
*   The Markdown file is the *only* place where you are allowed to be verbose. 
*   **Function-by-Function:** Break down the rationale per function block.
*   **Dry Runs Ensure Safety:** Include a real-world scenario (Dry Run) to prove the logic is sound without requiring the developer to execute the code manually.

## 3. Communication
*   When executing tasks, rely on specific tool operations (like `write_to_file`) rather than dumping massive bash scripts that pipe code around.
*   Keep interactive responses brief, focusing on the progress made and relying on the generated artifacts to convey the deep knowledge.
