// Test title extraction logic
async function testTitleExtraction() {
  // Simulate what Perplexity might return
  const mockPerplexityContent = `ESPN's Molly Qerim Shocks Sports World with Sudden 'First Take' Exit

ESPN host Molly Qerim has announced her departure from the popular morning show "First Take," sending shockwaves through the sports media landscape. The announcement came via social media, where Qerim shared her decision with fans and colleagues.

## Background

Qerim has been a fixture on ESPN's "First Take" since 2015, serving as the show's moderator alongside Stephen A. Smith and various guest analysts. Her departure marks the end of a significant era for the program.

## Industry Impact

The sports media industry is buzzing with speculation about Qerim's next move and who might replace her on the show.

CATEGORY: Sports`;

  console.log('🧪 Testing title extraction logic...');
  console.log('📝 Mock content from Perplexity:');
  console.log(mockPerplexityContent);
  console.log('\n' + '='.repeat(50) + '\n');

  // Simulate the cleaning process
  let cleanContent = mockPerplexityContent
    .replace(/^\*\*Excerpt:\*\*.*$/gm, '') // Remove excerpt markers
    .replace(/^##?\s*SEO.*$/gm, '') // Remove SEO sections
    .replace(/^##?\s*Tags.*$/gm, '') // Remove tags sections
    .replace(/^\*\*Title:\*\*.*$/gm, '') // Remove title markers
    .replace(/^\*\*Description:\*\*.*$/gm, '') // Remove description markers
    .replace(/^---+$/gm, '') // Remove separator lines
    .replace(/\[\d+\]/g, '') // Remove citation numbers like [1], [2], [3]
    .trim();

  console.log('🧹 After cleaning:');
  console.log(cleanContent);
  console.log('\n' + '='.repeat(50) + '\n');

  // Extract category
  let aiSuggestedCategory = '';
  const categoryMatch = cleanContent.match(/CATEGORY:\s*([^\n]+)/i);
  if (categoryMatch) {
    aiSuggestedCategory = categoryMatch[1].trim();
    cleanContent = cleanContent.replace(/CATEGORY:\s*[^\n]+/i, '').trim();
    console.log(`🎯 AI suggested category: "${aiSuggestedCategory}"`);
  }

  console.log('🧹 After category extraction:');
  console.log(cleanContent);
  console.log('\n' + '='.repeat(50) + '\n');

  // Extract title
  const lines = cleanContent.split('\n').filter(line => line.trim());
  let title = '';
  let articleContent = cleanContent;

  console.log('🔍 First 5 lines of clean content:');
  lines.slice(0, 5).forEach((line, i) => {
    console.log(`${i + 1}: "${line}"`);
  });

  if (lines.length > 0) {
    const firstLine = lines[0].trim();
    console.log(`\n🔍 Analyzing first line: "${firstLine}"`);
    console.log(`🔍 Length: ${firstLine.length}, Words: ${firstLine.split(' ').length}`);
    console.log(`🔍 Starts with #: ${firstLine.startsWith('#')}, Starts with *: ${firstLine.startsWith('*')}`);
    console.log(`🔍 Ends with .: ${firstLine.endsWith('.')}`);
    console.log(`🔍 Contains 'article': ${firstLine.includes('article')}`);
    console.log(`🔍 Starts with 'The following': ${firstLine.startsWith('The following')}`);

    // Test the conditions
    const condition1 = firstLine.length > 10;
    const condition2 = firstLine.length < 150;
    const condition3 = !firstLine.startsWith('#');
    const condition4 = !firstLine.startsWith('*');
    const condition5 = !firstLine.startsWith('The following');
    const condition6 = !firstLine.includes('article');
    const condition7 = firstLine.split(' ').length <= 20;

    console.log(`\n🔍 Condition checks:`);
    console.log(`- Length > 10: ${condition1}`);
    console.log(`- Length < 150: ${condition2}`);
    console.log(`- Not starts with #: ${condition3}`);
    console.log(`- Not starts with *: ${condition4}`);
    console.log(`- Not starts with 'The following': ${condition5}`);
    console.log(`- Not contains 'article': ${condition6}`);
    console.log(`- Words <= 20: ${condition7}`);

    const allConditions = condition1 && condition2 && condition3 && condition4 && condition5 && condition6 && condition7;
    console.log(`- ALL CONDITIONS MET: ${allConditions}`);

    if (allConditions) {
      title = firstLine;
      articleContent = lines.slice(1).join('\n').trim();
      console.log(`\n✅ Extracted title: "${title}"`);
    } else {
      console.log(`\n❌ First line does not match headline criteria`);
      console.log(`🔄 Would use fallback title`);
    }
  }

  console.log('\n' + '='.repeat(50));
  console.log(`📊 FINAL RESULTS:`);
  console.log(`- Category: ${aiSuggestedCategory}`);
  console.log(`- Title: ${title || 'FALLBACK WOULD BE USED'}`);
  console.log(`- Article content length: ${articleContent.length}`);
}

testTitleExtraction();
