import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

// Renders post Markdown server-side. react-markdown ignores raw HTML by default,
// so admin-authored Markdown is XSS-safe. Styling via descendant utilities keeps
// the rendered standard tags on-brand without a typography plugin.
export default function Markdown({ children }: { children: string }) {
  return (
    <div
      className="text-[15px] leading-7 text-zinc-700
        [&_a]:font-medium [&_a]:text-rose-600 [&_a]:underline [&_a]:underline-offset-2 hover:[&_a]:text-rose-700
        [&_blockquote]:mt-5 [&_blockquote]:border-l-4 [&_blockquote]:border-rose-200 [&_blockquote]:pl-4 [&_blockquote]:italic [&_blockquote]:text-zinc-600
        [&_code]:rounded [&_code]:bg-zinc-100 [&_code]:px-1 [&_code]:py-0.5 [&_code]:text-[13px]
        [&_h2]:mt-9 [&_h2]:text-xl [&_h2]:font-bold [&_h2]:tracking-tight [&_h2]:text-zinc-900
        [&_h3]:mt-7 [&_h3]:text-lg [&_h3]:font-semibold [&_h3]:text-zinc-900
        [&_hr]:my-8 [&_hr]:border-zinc-200
        [&_img]:mt-5 [&_img]:rounded-xl
        [&_li]:mt-1
        [&_ol]:mt-4 [&_ol]:list-decimal [&_ol]:pl-6
        [&_p]:mt-4
        [&_strong]:font-semibold [&_strong]:text-zinc-900
        [&_ul]:mt-4 [&_ul]:list-disc [&_ul]:pl-6"
    >
      <ReactMarkdown remarkPlugins={[remarkGfm]}>{children}</ReactMarkdown>
    </div>
  );
}
