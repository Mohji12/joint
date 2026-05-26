import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { Mail, Phone, MapPin, Linkedin, Twitter, Facebook, Instagram } from "lucide-react";
const appLogo = "/image/IMG-20260323-WA0012-removebg-preview.png";

const Footer = () => {
  const currentYear = new Date().getFullYear();

  const footerSections = [
    {
      title: "Company",
      links: [
        { label: "About Us", href: "/about" },
        { label: "Our Story", href: "/about#story" },
        { label: "Careers", href: "/careers" },
        { label: "Blog", href: "/blog" },
        { label: "Press Kit", href: "/press" },
      ],
    },
    {
      title: "Legal",
      links: [
        { label: "Terms of Service", href: "/legal/terms" },
        { label: "Privacy Policy", href: "/legal/privacy" },
        { label: "LegalAID", href: "/legal/legal-aid" },
      ],
    },
    {
      title: "Resources",
      links: [
        { label: "Documentation", href: "/docs" },
        { label: "Community", href: "/community" },
        { label: "Partners", href: "/partners" },
      ],
    },
  ];

  const socialLinks = [
    { icon: Linkedin, href: "https://linkedin.com/company/jointlly", label: "LinkedIn" },
    { icon: Facebook, href: "https://facebook.com/jointlly", label: "Facebook" },
    { icon: Instagram, href: "https://instagram.com/jointlly", label: "Instagram" },
  ];

  return (
    <footer 
      className="relative border-t border-primary-foreground/20 overflow-hidden bg-primary/95 text-primary-foreground"
    >
      {/* Overlay for better text readability */}
      <div className="absolute inset-0 bg-transparent" />
      
      {/* Decorative background elements */}
      <div className="absolute inset-0 opacity-20">
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-[#F3B24A]/20 rounded-full blur-3xl" />
        <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-[#F3B24A]/20 rounded-full blur-3xl" />
      </div>

      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-12 lg:py-16">
        <h2 className="text-center text-primary-foreground font-bold text-lg sm:text-xl md:text-2xl mb-8 sm:mb-10">
          Jointlly is an online facilitator platform
        </h2>

        {/* Main Footer Content */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-6 sm:gap-8 lg:gap-12 mb-10 sm:mb-12">
          {/* Brand Section */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            viewport={{ once: true }}
            className="col-span-2 lg:col-span-2"
          >
            <img
              src={appLogo}
              alt="Jointlly footer logo"
              className="h-20 sm:h-24 w-auto mb-4"
            />
            <p className="text-sm text-primary-foreground/85 mb-6 max-w-xs">
            The Validation Report is based on publicly available government records.<br></br>While
            Jointlly strives for accuracy, users are advised to conduct independent legal due diligence
            before entering into any binding agreements.
            </p>
            
            
            {/* Contact Info */}
            <div className="space-y-3">
              <a
                href="mailto:sales@jointlly.com"
                className="flex items-center gap-2 text-sm text-primary-foreground/75 hover:text-primary-foreground transition-colors group"
              >
                <Mail className="w-4 h-4 group-hover:scale-110 transition-transform" />
                <span>sales@jointlly.com</span>
              </a>
              <a
                href="tel:+919611268009"
                className="flex items-center gap-2 text-sm text-primary-foreground/75 hover:text-primary-foreground transition-colors group"
              >
                <Phone className="w-4 h-4 group-hover:scale-110 transition-transform" />
                <span>+91 9611268009</span>
              </a>
              <div className="flex items-start gap-2 text-sm text-primary-foreground/75">
                <MapPin className="w-4 h-4 mt-0.5 flex-shrink-0" />
                <span>Banshankri, Bengaluru</span>
              </div>
            </div>
          </motion.div>

          {/* Footer Links Sections */}
          {footerSections.map((section, index) => (
            <motion.div
              key={section.title}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
              viewport={{ once: true }}
              className="lg:col-span-1"
            >
              <h3 className="text-sm font-semibold text-primary-foreground mb-4 font-heading">
                {section.title}
              </h3>
              <ul className="space-y-2">
                {section.links.map((link) => (
                  <li key={link.label}>
                    <Link
                      to={link.href}
                      className="text-sm text-primary-foreground/75 hover:text-primary-foreground transition-colors inline-block py-1.5 hover:translate-x-1 transition-transform min-h-[32px] flex items-center"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </motion.div>
          ))}
        </div>

        {/* Divider */}
        <div className="border-t border-primary-foreground/20 my-8" />

        {/* Bottom Section */}
        <div className="flex flex-col md:flex-row items-center justify-between gap-6">
          {/* Copyright */}
          <motion.div
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            transition={{ duration: 0.5, delay: 0.3 }}
            viewport={{ once: true }}
            className="text-sm text-primary-foreground/75 text-center md:text-left"
          >
            <p>© {currentYear} Jointlly. All rights reserved.</p>
            <p className="mt-1 text-xs text-primary-foreground/60">
              Jointlly is a registered trademark. All product names, logos, and brands are property of their respective owners.
            </p>
          </motion.div>

          {/* Social Links */}
          <motion.div
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            transition={{ duration: 0.5, delay: 0.4 }}
            viewport={{ once: true }}
            className="flex items-center gap-4"
          >
            {socialLinks.map((social) => {
              const Icon = social.icon;
              return (
                <a
                  key={social.label}
                  href={social.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={social.label}
                  className="w-10 h-10 rounded-lg bg-primary-foreground/10 hover:bg-primary-foreground/15 border border-primary-foreground/25 hover:border-primary-foreground/35 flex items-center justify-center text-primary-foreground/80 hover:text-primary-foreground transition-all duration-300 hover:scale-110"
                >
                  <Icon className="w-5 h-5" />
                </a>
              );
            })}
          </motion.div>
        </div>

        {/* Legal Notice */}
        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          transition={{ duration: 0.5, delay: 0.5 }}
          viewport={{ once: true }}
          className="mt-8 pt-6 border-t border-primary-foreground/20"
        >
          <div className="flex flex-col md:flex-row items-center justify-center gap-4 md:gap-6 text-xs text-primary-foreground/75">
            <Link to="/legal/terms" className="hover:text-primary-foreground transition-colors">
              Terms of Service
            </Link>
            <span className="hidden md:inline text-primary-foreground/60">•</span>
            <Link to="/legal/privacy" className="hover:text-primary-foreground transition-colors">
              Privacy Policy
            </Link>
            <span className="hidden md:inline text-primary-foreground/60">•</span>
            <span>
              Last updated: {new Date().toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
            </span>
          </div>
        </motion.div>
      </div>
    </footer>
  );
};

export default Footer;
