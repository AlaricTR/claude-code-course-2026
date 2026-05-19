name: js-translate
description: Use this when the user requests help or explanation with Javascript syntax or semantics. Draw parallels with C++ syntax, since the user is more familiar with it. Trigger it on questions like "Explain this JS syntax" or "How does this work", especially when used with Javascript specific syntax like awaits, async, template literals or arrow functions.

# js-translate
The user knows C++ well. They have very limited knowledge in Javscript. Your job is to translate the Javascript code into it's closest possible C++ implementation, then explain any limits to this parallel.

## format
1. One or two line summary of what the JS does
2. Side by side equivalent of code blocks, with the JS on the left and the C++ on the right. 
3. Finish with a few bullet points explaining what translates and what doesn't, focusing on the parts that do not translate. Skip this if the analogy is clean/works well.

## rules
- Use examples over long explanation
- Assume basic programming knowledge (loops, if statements etc...)
- If there are multiple unknown syntaxes, treat each one individually
- if the syntax does not have an analogous parallel in C++, use a mental model instead