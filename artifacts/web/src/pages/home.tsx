import { useState, useRef, useEffect } from "react";
import { useSendChatMessage, useGetChatHistory, getGetChatHistoryQueryKey } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { Bot, User, Send, Loader2, Code2, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";

// Simple markdown parser to handle code blocks
const MarkdownRenderer = ({ content }: { content: string }) => {
  const parts = content.split(/(```[\s\S]*?```)/g);

  return (
    <div className="space-y-4 text-sm leading-relaxed">
      {parts.map((part, index) => {
        if (part.startsWith("```") && part.endsWith("```")) {
          const match = part.match(/```(\w+)?\n?([\s\S]*?)```/);
          const code = match ? match[2] : part.replace(/```/g, "");
          const lang = match && match[1] ? match[1] : "code";

          return (
            <div key={index} className="rounded-md overflow-hidden border border-border bg-[#0a0a0f] my-4">
              <div className="flex items-center justify-between px-4 py-1.5 bg-[#1c1c21] border-b border-border/50 text-xs text-muted-foreground">
                <span className="font-mono">{lang}</span>
              </div>
              <pre className="p-4 overflow-x-auto text-[13px] font-mono text-zinc-300">
                <code>{code.trim()}</code>
              </pre>
            </div>
          );
        }
        
        // Split by single backticks for inline code
        const inlineParts = part.split(/(`[^`]+`)/g);
        return (
          <p key={index} className="whitespace-pre-wrap">
            {inlineParts.map((inline, i) => {
              if (inline.startsWith("`") && inline.endsWith("`")) {
                return (
                  <code key={i} className="px-1.5 py-0.5 rounded bg-muted/50 font-mono text-[13px] text-zinc-300">
                    {inline.replace(/`/g, "")}
                  </code>
                );
              }
              return <span key={i}>{inline}</span>;
            })}
          </p>
        );
      })}
    </div>
  );
};

export default function Home() {
  const queryClient = useQueryClient();
  const [question, setQuestion] = useState("");
  const [code, setCode] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);
  
  const { data: chatHistory, isLoading: isLoadingHistory } = useGetChatHistory();
  const sendMutation = useSendChatMessage();

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [chatHistory, sendMutation.isPending]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!question.trim()) return;

    sendMutation.mutate(
      { data: { question, code } },
      {
        onSuccess: () => {
          setQuestion("");
          setCode("");
          queryClient.invalidateQueries({ queryKey: getGetChatHistoryQueryKey() });
        },
      }
    );
  };

  return (
    <div className="flex flex-col h-[100dvh] bg-background text-foreground overflow-hidden">
      {/* Header */}
      <header className="flex-none h-14 border-b border-border flex items-center px-6 shrink-0 bg-card">
        <div className="flex items-center gap-2 text-primary font-medium">
          <Code2 className="h-5 w-5" />
          <span>ReviewBot</span>
        </div>
        <div className="ml-4 text-xs text-muted-foreground border-l border-border pl-4">
          Senior AI Code Reviewer
        </div>
      </header>

      {/* Chat Area */}
      <main className="flex-1 overflow-y-auto min-h-0 relative">
        <div className="max-w-4xl mx-auto w-full pt-8 pb-32 px-4 flex flex-col gap-8">
          {isLoadingHistory ? (
            <div className="flex items-center justify-center h-32 text-muted-foreground gap-2">
              <Loader2 className="h-5 w-5 animate-spin" />
              <span className="text-sm">Loading history...</span>
            </div>
          ) : !chatHistory || chatHistory.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-64 text-center space-y-4 text-muted-foreground">
              <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center">
                <Bot className="h-6 w-6 text-primary" />
              </div>
              <div>
                <h3 className="font-medium text-foreground text-lg mb-1">Ready to review</h3>
                <p className="text-sm max-w-sm">
                  Paste your code snippet below and ask a question. I'll help you spot bugs, optimize performance, and improve architecture.
                </p>
              </div>
            </div>
          ) : (
            chatHistory.map((msg) => (
              <div key={msg.id} className="flex flex-col gap-6">
                {/* User Message */}
                <div className="flex gap-4">
                  <div className="h-8 w-8 shrink-0 rounded-md bg-secondary flex items-center justify-center border border-border">
                    <User className="h-4 w-4 text-secondary-foreground" />
                  </div>
                  <div className="flex-1 space-y-2 overflow-hidden pt-1">
                    <div className="text-sm text-foreground">{msg.question}</div>
                    {msg.code && (
                      <div className="rounded-md border border-border bg-[#0a0a0f] overflow-hidden mt-2">
                        <pre className="p-3 text-[13px] font-mono text-zinc-400 overflow-x-auto">
                          <code>{msg.code}</code>
                        </pre>
                      </div>
                    )}
                  </div>
                </div>

                {/* AI Response */}
                <div className="flex gap-4">
                  <div className="h-8 w-8 shrink-0 rounded-md bg-primary/10 flex items-center justify-center border border-primary/20">
                    <Bot className="h-4 w-4 text-primary" />
                  </div>
                  <div className="flex-1 overflow-hidden pt-1">
                    <MarkdownRenderer content={msg.answer} />
                  </div>
                </div>
              </div>
            ))
          )}

          {/* Loading Indicator */}
          {sendMutation.isPending && (
            <div className="flex gap-4">
              <div className="h-8 w-8 shrink-0 rounded-md bg-primary/10 flex items-center justify-center border border-primary/20">
                <Bot className="h-4 w-4 text-primary" />
              </div>
              <div className="flex-1 pt-1 flex items-center gap-2 text-muted-foreground text-sm">
                <Loader2 className="h-4 w-4 animate-spin" />
                Analyzing code...
              </div>
            </div>
          )}
          
          <div ref={messagesEndRef} className="h-1" />
        </div>
      </main>

      {/* Input Area */}
      <div className="flex-none border-t border-border bg-card p-4 shrink-0">
        <div className="max-w-4xl mx-auto">
          {sendMutation.isError && (
            <div className="mb-3 flex items-center gap-2 text-sm text-destructive bg-destructive/10 px-3 py-2 rounded-md border border-destructive/20">
              <AlertCircle className="h-4 w-4" />
              Failed to send request. Please try again.
            </div>
          )}
          
          <form onSubmit={handleSubmit} className="flex flex-col gap-3">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="flex flex-col gap-2">
                <label htmlFor="question" className="text-xs font-medium text-muted-foreground ml-1">
                  Question / Context
                </label>
                <Textarea
                  id="question"
                  value={question}
                  onChange={(e) => setQuestion(e.target.value)}
                  placeholder="E.g., Can you review this React component for performance issues?"
                  className="min-h-[120px] resize-none bg-background border-border focus-visible:ring-primary/50 text-sm"
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
                      e.preventDefault();
                      handleSubmit(e);
                    }
                  }}
                />
              </div>
              <div className="flex flex-col gap-2">
                <label htmlFor="code" className="text-xs font-medium text-muted-foreground ml-1 flex justify-between">
                  <span>Code</span>
                  <span className="opacity-50 font-normal">Optional</span>
                </label>
                <Textarea
                  id="code"
                  value={code}
                  onChange={(e) => setCode(e.target.value)}
                  placeholder="Paste your code snippet here..."
                  className="min-h-[120px] resize-none font-mono text-[13px] bg-[#0a0a0f] border-border focus-visible:ring-primary/50 text-zinc-300"
                  spellCheck={false}
                />
              </div>
            </div>
            
            <div className="flex justify-between items-center mt-1">
              <div className="text-xs text-muted-foreground">
                <kbd className="px-1.5 py-0.5 rounded bg-muted/50 border border-border font-mono text-[10px]">Cmd</kbd>
                {' '}+{' '}
                <kbd className="px-1.5 py-0.5 rounded bg-muted/50 border border-border font-mono text-[10px]">Enter</kbd>
                {' '}to send
              </div>
              <Button 
                type="submit" 
                disabled={!question.trim() || sendMutation.isPending}
                className="gap-2 h-9 px-4 bg-primary text-primary-foreground hover:bg-primary/90 transition-all"
              >
                {sendMutation.isPending ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Send className="h-4 w-4" />
                )}
                Review Code
              </Button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
