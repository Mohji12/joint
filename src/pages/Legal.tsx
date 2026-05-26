import { motion } from "framer-motion";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { Scale, Building2, Database, Shield, CheckCircle2, AlertTriangle } from "lucide-react";

const Legal = () => {
  const sections = [
    {
      icon: Scale,
      title: "1. Nature of Platform (Declaration)",
      items: [
        {
          label: "Intermediary Status",
          content: 'Jointlly (the "Platform") is a Digital Intermediary as defined under Section 2(1)(w) of the Information Technology Act, 2000. We operate as a neutral, automated matchmaking infrastructure.',
        },
        {
          label: "Automated Processing",
          content: 'All matches between Landowners ("Clients") and Builders/Architects ("Vendors") are performed algorithmically based on user-inputted parameters.',
        },
        {
          label: "No Initiation",
          content: "Jointlly does not initiate the transmission, select the receiver of the transmission, or modify the information contained in the transmission.",
        },
        {
          label: "Intermediary Protection",
          content: "Pursuant to Section 79 of the IT Act, 2000, Jointlly shall not be liable for any third-party data, communication, or actions of the users on the platform.",
        },
      ],
    },
    {
      icon: Building2,
      title: "2. RERA Compliance & Liability Decoupling",
      items: [
        {
          label: "Facilitation Only",
          content: "Jointlly acts solely as a Real Estate/Facilitator. Our responsibility concludes upon the successful introduction of the parties.",
        },
        {
          label: "Project Verification",
          content: "For any project exceeding 500 square meters or eight (8) units, the responsibility to provide a valid RERA Project Registration Number lies solely with the Vendor.",
        },
        {
          label: "Statutory Warning",
          content: "If a Vendor has not provided a RERA ID, the Client is hereby notified that the project may not be registered. Jointlly expressly disclaims all liability for transactions involving non-RERA-registered projects where registration is mandatory by law.",
        },
      ],
    },
    {
      icon: Database,
      title: "3. Data Processing & DPDP Act 2023 Compliance",
      items: [
        {
          label: "Data Fiduciary Status",
          content: "Jointlly operates as a Data Fiduciary under the Digital Personal Data Protection Act, 2023.",
        },
        {
          label: "Notice of Purpose",
          content: "Personal and property data (including PID and Location) are collected and processed for the sole purpose of facilitating a match with a maximum of three (5) verified Vendors.",
        },
        {
          label: "Affirmative Consent",
          content: 'By clicking "Accept" or "Post Project," the User provides clear, affirmative consent for such processing.',
        },
        {
          label: "Withdrawal of Consent",
          content: "Users may manage or revoke consent through the Consent Manager located in the Account Settings. Upon revocation, Jointlly will cease data processing subject to statutory data retention requirements (e.g., tax and audit logs).",
        },
      ],
    },
    {
      icon: Shield,
      title: "4. Limitation of Liability & Due Diligence Defense",
      items: [
        {
          label: "Standard Due Diligence",
          content: "Jointlly performs Standard Due Diligence on all Vendors, which includes the collection of:",
          subItems: [
            "Identity Verification: Verified PAN and GSTIN via authorized APIs.",
            "Professional Disclosure: Self-declared history of completed projects.",
            "Non-Debarment Affidavit: A digital declaration that the Vendor is not blacklisted by any government authority.",
            "Corporate Records: Director Identification Numbers (DIN) for all corporate entities.",
          ],
        },
        {
          label: "Disclaimer",
          content: "Notwithstanding the above, Jointlly does not warrant the financial solvency, technical competence, or moral conduct of any Vendor. Any contract entered into is strictly between the Client and the Vendor. Jointlly shall not be liable for any fraud, 'Abetment of Fraud,' or deficiency of service arising from such third-party contracts.",
        },
      ],
    },
  ];

  return (
    <div className="min-h-screen bg-background overflow-x-hidden">
      <Navbar />
      <div className="absolute inset-0 bg-gradient-to-br from-emerald-50/70 via-green-50/60 to-teal-50/70" />
      <div className="absolute inset-0 jointlly-grid opacity-40" />
      <div className="relative z-10 pt-20 sm:pt-24 md:pt-28 pb-12 sm:pb-16 md:pb-24">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Header */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="text-center mb-8 sm:mb-12"
          >
            <h1 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold mb-3 sm:mb-4">
              <span className="text-gradient-primary">Legal Architecture</span>
              <br />
              <span className="text-foreground">& Intermediary Disclosure</span>
            </h1>
            <p className="text-sm sm:text-base text-muted-foreground max-w-xl mx-auto">
              Jointlly Pvt Ltd
            </p>
            <p className="text-xs sm:text-sm text-muted-foreground mt-2">
              Last updated: {new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}
            </p>
          </motion.div>

          {/* Legal Sections */}
          <div className="space-y-5 sm:space-y-8">
            {sections.map((section, sectionIndex) => {
              const Icon = section.icon;
              return (
                <motion.div
                  key={section.title}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: sectionIndex * 0.1 }}
                  className="glass-card p-4 sm:p-5 md:p-6 lg:p-8"
                >
                  <div className="flex items-start gap-3 sm:gap-4 mb-4 sm:mb-6">
                    <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-gradient-to-br from-primary/20 to-accent/20 flex items-center justify-center flex-shrink-0">
                      <Icon className="w-5 h-5 sm:w-6 sm:h-6 text-primary" />
                    </div>
                    <h2 className="text-lg sm:text-xl md:text-2xl lg:text-3xl font-bold text-foreground flex-1 min-w-0">
                      {section.title}
                    </h2>
                  </div>

                  <div className="space-y-4 sm:space-y-6 ml-0 md:ml-16">
                    {section.items.map((item, itemIndex) => (
                      <div key={itemIndex} className="space-y-2">
                        <h3 className="font-semibold text-foreground text-lg">
                          {item.label}
                        </h3>
                        <p className="text-muted-foreground leading-relaxed">
                          {item.content}
                        </p>
                        {item.subItems && (
                          <div className="mt-3 space-y-2 pl-4 border-l-2 border-primary/20">
                            {item.subItems.map((subItem, subIndex) => (
                              <div key={subIndex} className="flex items-start gap-2">
                                <CheckCircle2 className="w-4 h-4 text-primary mt-1 flex-shrink-0" />
                                <p className="text-muted-foreground">{subItem}</p>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </motion.div>
              );
            })}
          </div>

          {/* Footer Note */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.4 }}
            className="mt-12 p-6 rounded-xl bg-amber-500/10 border border-amber-500/20"
          >
            <div className="flex items-start gap-3">
              <AlertTriangle className="w-5 h-5 text-amber-500 mt-0.5 flex-shrink-0" />
              <p className="text-sm text-muted-foreground">
                <strong className="text-foreground">Important:</strong> This disclosure outlines Jointlly's legal architecture and intermediary status. By using our platform, you acknowledge and agree to these terms. For any legal queries, please contact our legal team at grievance@jointlly.in
              </p>
            </div>
          </motion.div>
        </div>
      </div>
      <Footer />
    </div>
  );
};

export default Legal;
