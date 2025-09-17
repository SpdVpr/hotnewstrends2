// Test the content generator directly to see what Perplexity returns
const { ContentGeneratorService } = require('./src/lib/services/content-generator.ts');

async function testContentGenerator() {
  console.log('🧪 Testing ContentGeneratorService...');
  
  const service = new ContentGeneratorService();
  
  const request = {
    topic: 'Microsoft AI breakthrough',
    category: 'Technology',
    targetLength: 800,
    tone: 'informative',
    audience: 'general'
  };
  
  try {
    console.log('📤 Generating content for:', request.topic);
    const result = await service.generateContent(request);
    
    console.log('✅ Content generated successfully!');
    console.log('📊 Result structure:');
    console.log('- Title:', result.title);
    console.log('- Content length:', result.content.length);
    console.log('- Category:', result.category);
    console.log('- Has sources:', result.content.includes('Sources:') ? 'YES' : 'NO');
    
    if (result.content.includes('Sources:')) {
      console.log('\n📚 Sources section found:');
      const lines = result.content.split('\n');
      const sourcesIndex = lines.findIndex(line => line.includes('Sources:'));
      if (sourcesIndex !== -1) {
        lines.slice(sourcesIndex).forEach(line => {
          if (line.trim()) console.log(line);
        });
      }
    } else {
      console.log('\n❌ No Sources section found in content');
      console.log('📝 Last 10 lines of content:');
      const lines = result.content.split('\n');
      lines.slice(-10).forEach((line, i) => {
        console.log(`${lines.length - 10 + i + 1}: ${line}`);
      });
    }
    
  } catch (error) {
    console.error('❌ Error generating content:', error.message);
    console.error('❌ Stack:', error.stack);
  }
}

testContentGenerator();
