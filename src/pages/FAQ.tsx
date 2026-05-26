import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

const faqs = [
  {
    id: "1",
    question: "What exactly is Jointlly?",
    answer: (
      <>
        <p className="mb-3">
          Jointlly is a platform facilitator and decision-enablement layer for real estate construction and joint development.
        </p>
        <p>
          We replace blind leads with a first layer of verification and structured validation, helping landowners and builders make clearer, more informed choices before committing.
        </p>
      </>
    ),
  },
  {
    id: "2",
    question: "Is Jointlly a construction company or broker?",
    answer: (
      <>
        <p className="mb-3"><strong>No.</strong></p>
        <p className="mb-3">
          Jointlly does not execute projects, manage construction, or act as a broker.
        </p>
        <p>
          Our role is limited to bringing structure and transparency to how teams are selected. All commercial terms, contracts, and execution responsibilities remain strictly between the involved parties.
        </p>
      </>
    ),
  },
  {
    id: "3",
    question: 'What do you mean by "first layer of verification"?',
    answer: (
      <>
        <p className="mb-3">
          A first layer of verification means initial screening and validation, not guarantees.
        </p>
        <p className="mb-2">We evaluate:</p>
        <ul className="list-disc pl-5 space-y-1 text-muted-foreground">
          <li>Past execution history</li>
          <li>Delivery discipline</li>
          <li>Team capability</li>
          <li>Regulatory alignment (FAR, zoning, RERA-readiness)</li>
        </ul>
        <p className="mt-3">
          This helps reduce uncertainty early   but it does not replace independent due diligence.
        </p>
      </>
    ),
  },
  {
    id: "4",
    question: "Are builders and professionals on Jointlly verified or certified?",
    answer: (
      <>
        <p className="mb-3">No certifications or guarantees are claimed.</p>
        <p>
          Builders and professionals are screened based on execution history, team strength, and on-time delivery patterns. Final evaluation and selection decisions always remain with the landowner or partner.
        </p>
      </>
    ),
  },
  {
    id: "5",
    question: "Does Jointlly guarantee project outcomes or timelines?",
    answer: (
      <>
        <p className="mb-3"><strong>No.</strong></p>
        <p>
          Jointlly does not guarantee quality, timelines, costs, or outcomes. We enable better starting decisions, not execution control.
        </p>
      </>
    ),
  },
  {
    id: "6",
    question: "How does Jointlly handle Joint Venture (JV/JD) transparency?",
    answer: (
      <>
        <p className="mb-2">We introduce clarity by:</p>
        <ul className="list-disc pl-5 space-y-1 text-muted-foreground mb-3">
          <li>Making regulatory norms visible upfront</li>
          <li>Structuring deal discussions around realistic FAR and feasibility</li>
          <li>Reducing broker-driven bias</li>
        </ul>
        <p>
          Final JV terms, agreements, and execution are independently negotiated by the parties involved.
        </p>
      </>
    ),
  },
  {
    id: "7",
    question: "Should I still do my own legal and technical checks?",
    answer: (
      <>
        <p className="mb-3">
          <strong>Absolutely   and this is critical.</strong>
        </p>
        <p className="mb-2">
          Jointlly strongly recommends that all users conduct independent background verification, including:
        </p>
        <ul className="list-disc pl-5 space-y-1 text-muted-foreground mb-3">
          <li>Legal due diligence and title checks</li>
          <li>Regulatory approvals</li>
          <li>Financial evaluation</li>
          <li>Contract review with qualified lawyers and professionals</li>
        </ul>
        <p>
          Jointlly does not replace legal, technical, or financial advisors.
        </p>
      </>
    ),
  },
  {
    id: "8",
    question: "Who is responsible once I engage a builder or professional?",
    answer: (
      <>
        <p className="mb-3">
          Once you engage a builder, contractor, or designer, all responsibilities lie solely between you and them.
        </p>
        <p>
          Jointlly's role ends at facilitating informed selection, not execution or supervision.
        </p>
      </>
    ),
  },
  {
    id: "9",
    question: "Is Jointlly only for Joint Ventures?",
    answer: (
      <>
        <p className="mb-3"><strong>No.</strong> Jointlly supports:</p>
        <ul className="list-disc pl-5 space-y-1 text-muted-foreground mb-3">
          <li>Contract construction</li>
          <li>Joint Ventures / Joint Development</li>
          <li>Renovation/Repaint and structural repair</li>
          <li>Interior architecture</li>
        </ul>
        <p>
          The common thread is decision clarity before execution begins.
        </p>
      </>
    ),
  },
  {
    id: "10",
    question: "Why use Jointlly instead of referrals or online portals?",
    answer: (
      <>
        <p className="mb-3">
          Referrals and portals rely on trust by association.
        </p>
        <p>
          Jointlly introduces structure, screening, and transparency   so decisions are based on information, not hope.
        </p>
      </>
    ),
  },
];

const FAQ = () => {
  return (
    <div className="min-h-screen bg-background overflow-x-hidden">
      <Navbar />
      <section className="relative pt-20 sm:pt-24 md:pt-28 pb-12 sm:pb-16 md:pb-24">
        <div className="absolute inset-0 bg-background" />
        <div className="absolute inset-0 jointlly-grid opacity-40" />
        <div className="relative z-10 max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="text-center mb-8 sm:mb-12"
          >
            <h1 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold mb-3 sm:mb-4">
              <span className="text-gradient-primary">Frequently Asked</span>
              <br />
              <span className="text-foreground">Questions</span>
            </h1>
            <p className="text-sm sm:text-base text-muted-foreground max-w-xl mx-auto px-2">
              Clear answers about Jointlly, verification, and how we support your decisions.
            </p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
          >
            <Accordion type="single" collapsible className="w-full space-y-0">
              {faqs.map((faq) => (
                <AccordionItem
                  key={faq.id}
                  value={faq.id}
                  className="border-b border-border/60 bg-card/50 rounded-lg px-4 md:px-6 mb-3 last:mb-0 shadow-sm"
                >
                  <AccordionTrigger className="text-left py-5 hover:no-underline hover:text-primary [&[data-state=open]]:text-primary">
                    <span className="font-semibold text-foreground pr-2">{faq.question}</span>
                  </AccordionTrigger>
                  <AccordionContent className="text-muted-foreground pb-5">
                    {faq.answer}
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          </motion.div>

          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3 }}
            className="mt-12 text-center"
          >
            <Link
              to="/contact"
              className="text-primary font-medium hover:underline"
            >
              Still have questions? Contact us →
            </Link>
            <p className="text-muted-foreground max-w-xl mx-auto">
            Jointlly does not execute construction or guarantee outcomes.
            Users are advised to conduct independent legal and technical due diligence before
            engagement.            
            </p>
            <p>
              <br></br>
            </p>
            <p className="text-muted-foreground max-w-xl mx-auto text-green/80 font-bold">
             Online Platform Facilator
            </p>
          </motion.div>
        </div>
      </section>
      <Footer />
    </div>
  );
};

export default FAQ;
