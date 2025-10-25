# AI Reply Formatting Rules - Complete Audit

## 📋 Audit Summary

**Date:** 2025-01-24  
**Status:** ✅ **ALL FORMATTING RULES CONSISTENTLY ENFORCED**

All 4 reply types (Professional, Quick Acknowledgment, Detailed, Custom) have been reviewed and confirmed to follow consistent formatting rules.

---

## ✅ Universal Formatting Rules (Applied to ALL Reply Types)

### 1. **Greeting Requirements** ✅

- ✅ Greeting MUST be on its own line
- ✅ Format: `"Hi [Name],"` or `"Hello [Name],"`
- ✅ Blank line after greeting (`\n\n`)
- ✅ Extract name from email address or content

**Enforcement in ALL prompts:**

- Professional: Line 83, 104, 115, 135-136
- Acknowledge: Line 148, 163, 175
- Detailed: Line 200, 231, 244
- Custom: Line 281, 315

### 2. **Paragraph Spacing Rules** ✅

- ✅ 2-3 sentences MAXIMUM per paragraph
- ✅ Blank lines between EVERY paragraph (`\n\n`)
- ✅ Each paragraph covers ONE main point
- ✅ Sentences are 15-20 words (ideal)
- ✅ NEVER write walls of text

**Enforcement in ALL prompts:**

- Professional: Lines 82-90, 103-107
- Acknowledge: Lines 147-153, 162-167
- Detailed: Lines 199-207, 230-235
- Custom: Lines 280-288, 314-319

### 3. **Closing Requirements** ✅

- ✅ Closing on its own line
- ✅ MUST end with comma: `"Best regards,"` `"Thanks,"`
- ✅ Blank line before closing
- ✅ Professional tone

**Enforcement in ALL prompts:**

- Professional: Line 90, 108, 119
- Acknowledge: Line 152, 167, 177
- Detailed: Line 207, 237, 253
- Custom: Line 288, 319

### 4. **Prohibited Content** ✅

- ❌ NO signature block (added separately)
- ❌ NO subject line or "RE:" in body
- ❌ NO quoted text from original email
- ❌ NO email headers (`"--- On [date], [email] wrote:"`)

**Enforcement in ALL prompts:**

- Professional: Lines 109-112
- Acknowledge: Lines 168-171
- Detailed: Lines 238-241
- Custom: Lines 320-323

### 5. **Visual Spacing Formula** ✅

All prompts include explicit spacing formulas with arrows (↓) showing where blank lines go:

**Professional (Lines 92-101):**

```
[Greeting],
↓ (blank line)
[Opening paragraph - 2-3 sentences]
↓ (blank line)
[Middle paragraph - 2-3 sentences]
↓ (blank line)
[Closing paragraph - 1-2 sentences]
↓ (blank line)
[Sign-off],
```

**Acknowledge (Lines 155-160):**

```
[Greeting],
↓ (blank line)
[Brief message - 2-3 sentences]
↓ (blank line)
[Sign-off],
```

**Detailed (Lines 209-228):**

```
[Greeting],
↓ (blank line)
[Opening paragraph]
↓ (blank line)
**Section Header:**
[Detail paragraph 1]
↓ (blank line)
...
```

**Custom (Lines 290-299):**

```
[Greeting],
↓ (blank line)
[Paragraph 1 - 2-3 sentences]
↓ (blank line)
[Paragraph 2 - 2-3 sentences]
↓ (blank line)
[Sign-off],
```

---

## 📊 Reply Type-Specific Rules

### **1. Professional Reply** ✅

**Word Count:** 100-150 words (guideline)  
**Token Limit:** 300 tokens  
**Tone:** Professional, polite, clear, concise

**Specific Rules:**

- ✅ Formal business language
- ✅ Brief paragraphs (2-3 sentences)
- ✅ Include pricing/timeline if relevant
- ✅ Professional closing: `"Best regards,"` `"Kind regards,"` `"Thank you,"`
- ✅ Direct and to the point

**Structure Enforcement (Lines 114-119):**

1. Professional greeting on own line
2. Opening acknowledgment (1-2 sentences)
3. Main response (1-2 short paragraphs, separated)
4. Closing action/next step (separate paragraph)
5. Professional closing with comma

**User Prompt Emphasis (Lines 132-139):**

- CRITICAL: Proper paragraph formatting
- 2-3 sentences per paragraph maximum
- MUST start with greeting
- Extract sender's first name
- End with ONLY closing (no name/signature)

---

### **2. Quick Acknowledgment** ✅

**Word Count:** 50-75 words (guideline)  
**Token Limit:** 300 tokens  
**Tone:** Friendly but brief, professional

**Specific Rules:**

- ✅ TOTAL of 2-3 sentences only
- ✅ Single short paragraph
- ✅ Acknowledge receipt
- ✅ Promise detailed follow-up with timing
- ✅ NO detailed information
- ✅ Brief closing: `"Best,"` `"Thanks,"` `"Best regards,"`

**Structure Enforcement (Lines 174-177):**

1. Friendly greeting on own line
2. Brief acknowledgment with follow-up promise (2-3 sentences)
3. Brief closing with comma

**User Prompt Emphasis (Lines 189-190):**

- CRITICAL: Proper spacing after greeting and before closing
- BRIEF (2-3 sentences total in one paragraph)
- NO detailed information

**Special Note:** Line 181 - "Keep it short and sweet with proper spacing!"

---

### **3. Detailed Response** ✅

**Word Count:** 250-400 words (guideline)  
**Token Limit:** 600 tokens (2x professional)  
**Tone:** Professional, thorough, organized, confident

**Specific Rules:**

- ✅ Multiple sections with **bold headers**
- ✅ Use bullet points or numbered lists
- ✅ Each paragraph = 2-3 sentences focused on one topic
- ✅ Include blank lines between sections AND paragraphs
- ✅ Address ALL points from original email
- ✅ Comprehensive details with specific examples
- ✅ Clear next steps or action items
- ✅ Professional closing: `"Best regards,"` `"Looking forward to,"`

**Structure Enforcement (Lines 243-253):**

1. Professional greeting on own line
2. Opening statement showing understanding
3. Multiple sections with headers:
   - Understanding of their needs
   - Proposed approach/solution
   - Technical specifications (if relevant)
   - Pricing/timeline (if applicable)
   - Why choose you/your company
   - Clear next steps
4. Professional closing with comma

**User Prompt Emphasis (Lines 272):**

- CRITICAL: Blank lines between ALL paragraphs and sections
- Each paragraph MUST be 2-3 sentences maximum
- Include sections, headers, and bullet points
- Be thorough and comprehensive

**Special Note:** Line 263 - "Even detailed responses need white space!"

---

### **4. Custom Reply** ✅

**Word Count:** Flexible (based on user instructions)  
**Token Limit:** 450 tokens  
**Tone:** Match user's requested style while maintaining professionalism

**Specific Rules:**

- ✅ Parse user instructions for:
  - Tone indicators (friendly, casual, formal, urgent, enthusiastic)
  - Length requirements (brief, short, detailed, comprehensive)
  - Focus areas (timeline, pricing, availability, expertise)
- ✅ Adapt greeting based on tone (Hi/Hello/Hey for casual, Hello/Dear for formal)
- ✅ Maintain proper paragraph spacing REGARDLESS of custom instructions
- ✅ Keep paragraphs short (2-3 sentences max) even with custom tone
- ✅ End with appropriate closing matching the tone

**Structure Enforcement (Lines 314-323):**

- All standard formatting rules ALWAYS apply
- User instructions modify tone/content, NOT structure
- Paragraph spacing is NON-NEGOTIABLE

**User Prompt Emphasis (Lines 338):**

- CRITICAL: Proper paragraph formatting with blank lines
- Each paragraph MUST be 2-3 sentences maximum
- Follow custom instructions for tone/length/focus
- Maintain proper email formatting

**Special Note:** Line 327 - "ALWAYS use proper paragraph spacing with blank lines, regardless of the custom instructions!"

**Instruction Parsing Examples (Lines 307-312):**

- "Make it friendly and casual" → Conversational tone (BUT still proper spacing!)
- "Focus on timeline and availability" → Emphasize scheduling
- "Emphasize our AI expertise" → Highlight capabilities
- "Keep it brief but professional" → Short response, formal language
- "Show enthusiasm" → Energetic language, positive tone

---

## 🔧 Technical Implementation

### OpenAI API Parameters (Lines 353-370)

**Model:** `gpt-4o-mini` (fast and cost-effective)

**Token Limits:**

- Professional: 300 tokens
- Acknowledge: 300 tokens
- Detailed: 600 tokens (for longer responses)
- Custom: 450 tokens (flexible)

**Temperature & Controls:**

- `temperature: 0.7` - Balanced creativity and consistency
- `top_p: 0.9` - Focused output
- `frequency_penalty: 0.5` - Reduce repetition
- `presence_penalty: 0.3` - Encourage focused responses

### Post-Processing (Lines 381-400)

**1. User Name Addition (Lines 384-395):**

```typescript
const userName =
  authUser?.user_metadata?.full_name ||
  authUser?.user_metadata?.name ||
  authUser?.email?.split('@')[0] ||
  'User';

finalReply = `${finalReply}\n\n${userName}`;
```

**Priority:**

1. Full name from user metadata
2. Name from user metadata
3. Email username (before @)
4. Fallback: "User"

**2. Signature Addition (Lines 397-400):**

```typescript
if (userSignature?.textContent) {
  finalReply = `${finalReply}\n${userSignature.textContent.trim()}`;
}
```

**Final Structure:**

```
[AI-generated reply with proper formatting]

[User Name]
[Signature Line 1]
[Signature Line 2]
...
```

---

## ✅ Formatting Consistency Checklist

### **Universal Rules (All 4 Types):**

- [x] Greeting on own line
- [x] Blank line after greeting
- [x] 2-3 sentences per paragraph maximum
- [x] Blank lines between all paragraphs
- [x] Each paragraph = one main point
- [x] Sentences 15-20 words (ideal)
- [x] Closing on own line
- [x] Blank line before closing
- [x] Closing ends with comma
- [x] NO signature block in AI reply
- [x] NO subject line or "RE:"
- [x] NO quoted text
- [x] NO email headers
- [x] Visual spacing formula provided
- [x] Explicit "CRITICAL" warnings

### **Reply Type-Specific:**

- [x] Professional: Formal tone, 100-150 words, pricing/timeline
- [x] Acknowledge: Brief (50-75 words), 2-3 sentences, promise follow-up
- [x] Detailed: Comprehensive (250-400 words), sections, headers, bullets
- [x] Custom: Parse instructions, maintain spacing regardless

### **User Prompt Reinforcement:**

- [x] Professional: Lines 132-139 ("CRITICAL", "IMPORTANT")
- [x] Acknowledge: Lines 189-190 ("CRITICAL")
- [x] Detailed: Line 272 ("CRITICAL")
- [x] Custom: Line 338 ("CRITICAL")

### **Name & Signature:**

- [x] User name fetched from auth
- [x] Blank line after AI reply
- [x] Name added automatically
- [x] Signature appended (if exists)
- [x] Fallback logic for missing name

---

## 📝 Recommendations

### ✅ **APPROVED - No Changes Needed**

All formatting rules are consistently enforced across all 4 reply types:

1. **Consistency:** ✅ Every reply type has identical formatting requirements
2. **Clarity:** ✅ Visual spacing formulas make requirements explicit
3. **Reinforcement:** ✅ "CRITICAL" warnings in both system AND user prompts
4. **Specificity:** ✅ Each reply type has appropriate word count and tone guidance
5. **Prohibition:** ✅ All unwanted content explicitly forbidden
6. **Structure:** ✅ Clear structure guidelines for each reply type
7. **Post-processing:** ✅ Consistent name and signature appending

### 💡 **Optional Future Enhancements**

**1. Add Examples to Prompts**
Consider adding before/after examples directly in the system prompts to show correct vs incorrect formatting.

**2. Add Validation Check**
Could add a post-generation validation that checks for:

- Presence of greeting
- Presence of closing
- No "--- On" text
- Paragraph count

**3. Add Retry Logic**
If validation fails, automatically retry with even more explicit instructions.

**4. Add Length Monitoring**
Track if replies consistently hit word count guidelines and adjust token limits if needed.

---

## 🎯 Conclusion

**Status:** ✅ **PRODUCTION READY**

All AI-generated email content follows formatting rules consistently:

- **4 Reply Types** - All have comprehensive formatting rules
- **Consistent Structure** - Greeting → Paragraphs → Closing → Name → Signature
- **Proper Spacing** - Blank lines enforced in all prompts
- **Clear Prohibitions** - No quoted text, headers, or signatures in AI reply
- **Post-Processing** - Automatic name and signature appending
- **Token Optimization** - Appropriate limits per reply type
- **AI Parameters** - Tuned for quality and consistency

**No changes required.** The formatting rules are comprehensive, consistent, and properly enforced.

---

**Audit Date:** 2025-01-24  
**Audited By:** AI Assistant  
**Files Reviewed:** `src/app/api/ai/generate-reply/route.ts` (418 lines)  
**Result:** ✅ ALL FORMATTING RULES CONSISTENTLY ENFORCED
