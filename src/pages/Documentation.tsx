import { useMemo } from "react";
import { motion } from "framer-motion";
import { FileText, Download, ExternalLink } from "lucide-react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { downloadUrlAsFile } from "@/lib/downloadFile";

type PdfItem = {
  name: string;
  url: string;
};

function titleFromFilename(filename: string): string {
  const base = filename.replace(/\.pdf$/i, "");
  return decodeURIComponent(base)
    .replace(/[_]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

const Documentation = () => {
  const pdfs = useMemo(() => {
    const modules = import.meta.glob("@/assets/pdfs/*.pdf", {
      eager: true,
      as: "url",
    }) as Record<string, string>;

    return Object.entries(modules)
      .map(([path, url]) => {
        const name = path.split("/").pop() || path;
        return { name, url } satisfies PdfItem;
      })
      .filter((item) => !/about\s*section\s*jointlly/i.test(titleFromFilename(item.name)))
      .sort((a, b) => a.name.localeCompare(b.name, undefined, { numeric: true }));
  }, []);

  return (
    <div className="min-h-screen bg-emerald-50 overflow-x-hidden">
      <Navbar />

      <main className="pt-20">
        <section className="py-16 sm:py-20">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4 }}
              className="max-w-2xl"
            >
              <h1 className="text-3xl sm:text-4xl font-bold mb-3">
                <span className="text-gradient-primary">Documentation</span>
              </h1>
              <p className="text-muted-foreground">
                Browse and download official documents and reference PDFs.
              </p>
            </motion.div>

            <div className="mt-10 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 sm:gap-6">
              {pdfs.map((pdf, idx) => (
                <motion.div
                  key={pdf.url}
                  initial={{ opacity: 0, y: 14 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.35, delay: Math.min(idx * 0.03, 0.25) }}
                  viewport={{ once: true }}
                  className="glass-card rounded-2xl border border-glass-border p-5 sm:p-6"
                >
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                      <FileText className="w-5 h-5 text-primary" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <h3 className="font-semibold text-foreground leading-snug">
                        {titleFromFilename(pdf.name)}
                      </h3>
                      <p className="text-xs text-muted-foreground mt-1 truncate">
                        {pdf.name}
                      </p>
                    </div>
                  </div>

                  <div className="mt-5 flex flex-col sm:flex-row gap-2">
                    <Button asChild className="btn-premium gap-2 min-h-[44px]">
                      <a href={pdf.url} target="_blank" rel="noopener noreferrer">
                        <ExternalLink className="w-4 h-4" />
                        Open
                      </a>
                    </Button>
                    <Button
                      variant="outline"
                      className="gap-2 min-h-[44px]"
                      onClick={() => void downloadUrlAsFile(pdf.url, pdf.name)}
                    >
                      <Download className="w-4 h-4" />
                      Download
                    </Button>
                  </div>
                </motion.div>
              ))}
            </div>

            {pdfs.length === 0 && (
              <div className="mt-10 text-muted-foreground">
                No PDFs found in <code className="px-1 py-0.5 rounded bg-muted">src/assets/pdfs</code>.
              </div>
            )}
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
};

export default Documentation;

