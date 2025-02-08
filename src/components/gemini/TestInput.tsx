"use client";

import { useState } from "react";
import { Button } from "~/components/ui/button";
import { Input } from "~/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "~/components/ui/card";
import { useSession } from "next-auth/react";

export default function TestInput() {
  const [input, setInput] = useState("");
  const [response, setResponse] = useState("");
  const [loading, setLoading] = useState(false);
  const { data: session } = useSession();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!session) {
      setResponse("Please sign in to use this feature");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/test-gemini", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ input }),
      });

      if (res.status === 401) {
        setResponse("Please sign in to use this feature");
        return;
      }

      const data = await res.json();
      setResponse(data.response);
    } catch (error) {
      console.error("Error:", error);
      setResponse("Error occurred while fetching response");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="w-full max-w-xl">
      <CardHeader>
        <CardTitle>Test Gemini API</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <Input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Enter your test query..."
            disabled={!session}
          />
          <Button type="submit" disabled={loading || !session}>
            {loading ? "Loading..." : "Submit"}
          </Button>
        </form>
        {response && (
          <div className="mt-4 rounded-md bg-secondary p-4">
            <pre className="whitespace-pre-wrap">{response}</pre>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
