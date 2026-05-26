import { motion } from "framer-motion";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { Mail, Phone, MapPin, Clock, MessageSquare, Globe, Linkedin, Twitter, Facebook, Instagram, Send, Building2, Users, Headphones } from "lucide-react";

const Contact = () => {
  const contactMethods = [
    {
      icon: Mail,
      title: "Email Us",
      description: "Drop us a line anytime",
      contact: "sales@jointlly.com",
      link: "mailto:sales@jointlly.com",
      color: "from-primary/20 to-primary/10",
      iconColor: "text-primary",
    },
    {
      icon: Phone,
      title: "Call Us",
      description: "Speak with our team",
      contact: "+91 9611268009",
      link: "tel:+919611268009",
      color: "from-accent/20 to-accent/10",
      iconColor: "text-accent",
    },
    {
      icon: MapPin,
      title: "Visit Our Office",
      description: "Come say hello",
      contact: "Banshankri, Bengaluru",
      link: "#",
      color: "from-primary/20 to-accent/20",
      iconColor: "text-primary",
    },
  ];

  const businessHours = [
    { day: "Monday - Saturday", hours: "9:00 AM - 6:00 PM" },
    { day: "Sunday", hours: "Off" },
  ];

  const socialLinks = [
    { icon: Linkedin, href: "https://linkedin.com/company/jointlly", label: "LinkedIn" },
    { icon: Twitter, href: "https://twitter.com/jointlly", label: "Twitter" },
    { icon: Facebook, href: "https://facebook.com/jointlly", label: "Facebook" },
    { icon: Instagram, href: "https://instagram.com/jointlly", label: "Instagram" },
  ];

  const departments = [
    {
      title: "General Inquiries",
      email: "sales@jointlly.com",
      description: "Questions about our services",
    },
    {
      title: "Support",
      email: "sales@jointlly.com",
      description: "Technical assistance",
    },
  ];

  return (
    <div className="min-h-screen bg-background overflow-x-hidden">
      <Navbar />
      
      {/* Hero Section */}
      <section className="relative pt-24 sm:pt-28 md:pt-32 pb-16 sm:pb-20 md:pb-24 overflow-hidden">
        {/* Background */}
        <div className="absolute inset-0 bg-background" />
        <div className="absolute inset-0 jointlly-grid opacity-30" />
        
        {/* Glow effects */}
        <motion.div
          className="absolute top-1/4 left-1/4 w-64 h-64 sm:w-80 sm:h-80 md:w-96 md:h-96 rounded-full bg-glow-gradient blur-3xl"
          animate={{
            scale: [1, 1.2, 1],
            opacity: [0.2, 0.35, 0.2],
          }}
          transition={{
            duration: 8,
            repeat: Infinity,
            ease: "easeInOut",
          }}
        />

        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="text-center max-w-4xl mx-auto"
          >
            <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl xl:text-7xl font-bold mb-4 sm:mb-6">
              <span className="text-gradient-primary">Contact Us</span>
            </h1>
            <p className="text-base sm:text-lg md:text-xl lg:text-2xl text-muted-foreground leading-relaxed mb-6 sm:mb-8 px-2">
              We're here to help! Reach out to us through any of the channels below, 
              and our team will get back to you as soon as possible.
            </p>
          </motion.div>
        </div>
      </section>

      {/* Main Contact Methods - Large Cards */}
      <section className="relative py-8 sm:py-10 md:py-12">
        <div className="absolute inset-0 bg-background" />
        <div className="absolute inset-0 jointlly-grid opacity-40" />
        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
            {contactMethods.map((method, index) => {
              const Icon = method.icon;
              return (
                <motion.a
                  key={method.title}
                  href={method.link}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: index * 0.1 }}
                  viewport={{ once: true }}
                  className="glass-card p-5 sm:p-6 md:p-8 hover:scale-[1.02] sm:hover:scale-105 transition-all duration-300 group relative overflow-hidden min-h-[44px]"
                >
                  {/* Gradient background on hover */}
                  <div className={`absolute inset-0 bg-gradient-to-br ${method.color} opacity-0 group-hover:opacity-100 transition-opacity duration-300`} />
                  
                  <div className="relative z-10">
                    <div className={`w-12 h-12 sm:w-14 sm:h-14 md:w-16 md:h-16 rounded-xl sm:rounded-2xl bg-gradient-to-br ${method.color} flex items-center justify-center mb-4 sm:mb-6 group-hover:scale-110 transition-transform duration-300`}>
                      <Icon className={`w-6 h-6 sm:w-7 sm:h-7 md:w-8 md:h-8 ${method.iconColor}`} />
                    </div>
                    <h3 className="text-lg sm:text-xl font-semibold mb-1 sm:mb-2">{method.title}</h3>
                    <p className="text-xs sm:text-sm text-muted-foreground mb-2 sm:mb-4">{method.description}</p>
                    <p className="text-sm sm:text-base font-medium text-primary group-hover:text-accent transition-colors break-words">
                      {method.contact}
                    </p>
                  </div>
                </motion.a>
              );
            })}
          </div>
        </div>
      </section>

      {/* Office Location & Business Hours */}
      <section className="relative py-12 sm:py-16 md:py-20">
        <div className="absolute inset-0 bg-background" />
        <div className="absolute inset-0 jointlly-grid opacity-40" />
        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-8 sm:gap-10 lg:gap-12">
            {/* Office Location */}
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              whileInView={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6 }}
              viewport={{ once: true }}
              className="glass-card p-5 sm:p-6 md:p-8 lg:p-12"
            >
              <div className="flex items-center gap-3 sm:gap-4 mb-6 sm:mb-8">
                <div className="w-12 h-12 sm:w-14 sm:h-14 md:w-16 md:h-16 rounded-xl sm:rounded-2xl bg-gradient-to-br from-primary/20 to-accent/20 flex items-center justify-center flex-shrink-0">
                  <Building2 className="w-6 h-6 sm:w-7 sm:h-7 md:w-8 md:h-8 text-primary" />
                </div>
                <div className="min-w-0">
                  <h2 className="text-2xl sm:text-3xl font-bold mb-1 sm:mb-2">Our Office</h2>
                  <p className="text-sm sm:text-base text-muted-foreground">Visit us at our headquarters</p>
                </div>
              </div>

              <div className="space-y-6">
                <div className="flex items-start gap-4">
                  <MapPin className="w-6 h-6 text-primary mt-1 flex-shrink-0" />
                  <div>
                    <h3 className="font-semibold mb-1">Address</h3>
                    <p className="text-muted-foreground leading-relaxed">
                      Banshankri, Bengaluru
                    </p>
                  </div>
                </div>

                <div className="pt-4 border-t border-border">
                  <h3 className="font-semibold mb-3">Getting Here</h3>
                  <ul className="space-y-2 text-sm text-muted-foreground">
                    <li>• 5 minutes walk from Metro Station</li>
                    <li>• Parking available on-site</li>
                    <li>• Wheelchair accessible</li>
                  </ul>
                </div>
              </div>
            </motion.div>

            {/* Business Hours & Quick Contact */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              whileInView={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6 }}
              viewport={{ once: true }}
              className="space-y-4 sm:space-y-6"
            >
              {/* Business Hours */}
              <div className="glass-card p-5 sm:p-6 md:p-8 lg:p-10">
                <div className="flex items-center gap-3 sm:gap-4 mb-6 sm:mb-8">
                  <div className="w-12 h-12 sm:w-14 sm:h-14 md:w-16 md:h-16 rounded-xl sm:rounded-2xl bg-gradient-to-br from-accent/20 to-primary/20 flex items-center justify-center flex-shrink-0">
                    <Clock className="w-6 h-6 sm:w-7 sm:h-7 md:w-8 md:h-8 text-accent" />
                  </div>
                  <div className="min-w-0">
                    <h2 className="text-2xl sm:text-3xl font-bold mb-1 sm:mb-2">Business Hours</h2>
                    <p className="text-sm sm:text-base text-muted-foreground">When we're available</p>
                  </div>
                </div>

                <div className="space-y-2 sm:space-y-4">
                  {businessHours.map((schedule, index) => (
                    <div
                      key={schedule.day}
                      className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-0.5 py-2.5 sm:py-3 border-b border-border/50 last:border-0"
                    >
                      <span className="text-foreground font-medium text-sm sm:text-base">{schedule.day}</span>
                      <span className="text-muted-foreground text-sm">{schedule.hours}</span>
                    </div>
                  ))}
                </div>

                <div className="mt-8 p-4 rounded-xl bg-gradient-to-br from-primary/5 to-accent/5 border border-primary/10">
                  <p className="text-sm text-muted-foreground mb-2">
                    <strong className="text-foreground">Note:</strong> All times are in IST (Indian Standard Time)
                  </p>
                </div>
              </div>

              {/* Quick Contact Form */}
              <div className="glass-card p-5 sm:p-6 md:p-8 lg:p-10">
                <div className="flex items-center gap-3 sm:gap-4 mb-4 sm:mb-6">
                  <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-gradient-to-br from-primary/20 to-accent/20 flex items-center justify-center flex-shrink-0">
                    <Send className="w-5 h-5 sm:w-6 sm:h-6 text-primary" />
                  </div>
                  <div>
                    <h3 className="text-lg sm:text-xl font-semibold">Quick Message</h3>
                    <p className="text-xs sm:text-sm text-muted-foreground">Send us a quick note</p>
                  </div>
                </div>
                <a
                  href="mailto:sales@jointlly.com?subject=Quick Inquiry"
                  className="btn-premium w-full flex items-center justify-center gap-2 min-h-[44px]"
                >
                  <Mail className="w-5 h-5" />
                  Send Email
                </a>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Department Contacts */}
      <section className="relative py-12 sm:py-16 md:py-20">
        <div className="absolute inset-0 bg-background" />
        <div className="absolute inset-0 jointlly-grid opacity-40" />
        <div className="relative z-10 max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            viewport={{ once: true }}
            className="text-center mb-8 sm:mb-12"
          >
            <h2 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold mb-3 sm:mb-4">
              <span className="text-gradient-primary">Department Contacts</span>
            </h2>
            <p className="text-base sm:text-lg text-muted-foreground max-w-2xl mx-auto px-2">
              Reach out to the right team for faster assistance
            </p>
          </motion.div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
            {departments.map((dept, index) => (
              <motion.a
                key={dept.title}
                href={`mailto:${dept.email}`}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                viewport={{ once: true }}
                className="glass-card p-4 sm:p-5 md:p-6 hover:scale-[1.02] sm:hover:scale-105 transition-all duration-300 group min-h-[44px]"
              >
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-primary/20 to-accent/20 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                  <Users className="w-6 h-6 text-primary" />
                </div>
                <h3 className="text-lg font-semibold mb-2">{dept.title}</h3>
                <p className="text-sm text-muted-foreground mb-3">{dept.description}</p>
                <p className="text-sm font-medium text-primary group-hover:text-accent transition-colors break-all">
                  {dept.email}
                </p>
              </motion.a>
            ))}
          </div>
        </div>
      </section>

      {/* Social Media & Follow Us */}
      <section className="relative py-12 sm:py-16 md:py-20">
        <div className="absolute inset-0 bg-background" />
        <div className="absolute inset-0 jointlly-grid opacity-40" />
        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            viewport={{ once: true }}
            className="glass-card p-5 sm:p-6 md:p-8 lg:p-12 text-center"
          >
            <div className="flex flex-col sm:flex-row items-center justify-center gap-3 sm:gap-4 mb-5 sm:mb-6">
              <div className="w-12 h-12 sm:w-14 sm:h-14 md:w-16 md:h-16 rounded-xl sm:rounded-2xl bg-gradient-to-br from-primary/20 to-accent/20 flex items-center justify-center flex-shrink-0">
                <Globe className="w-6 h-6 sm:w-7 sm:h-7 md:w-8 md:h-8 text-primary" />
              </div>
              <div>
                <h2 className="text-2xl sm:text-3xl font-bold mb-1 sm:mb-2">Follow Us</h2>
                <p className="text-sm sm:text-base text-muted-foreground">Stay connected on social media</p>
              </div>
            </div>

            <div className="flex items-center justify-center gap-3 sm:gap-4 flex-wrap">
              {socialLinks.map((social) => {
                const Icon = social.icon;
                return (
                  <a
                    key={social.label}
                    href={social.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label={social.label}
                    className="w-12 h-12 sm:w-14 sm:h-14 rounded-xl bg-gradient-to-br from-primary/10 to-accent/10 hover:from-primary/20 hover:to-accent/20 border border-glass-border hover:border-primary/30 flex items-center justify-center text-muted-foreground hover:text-primary transition-all duration-300 hover:scale-110 hover:shadow-lg hover:shadow-primary/10 min-w-[48px] min-h-[48px]"
                  >
                    <Icon className="w-5 h-5 sm:w-6 sm:h-6" />
                  </a>
                );
              })}
            </div>

            <p className="mt-6 sm:mt-8 text-xs sm:text-sm text-muted-foreground px-2">
              Join our community for updates, tips, and exclusive content
            </p>
          </motion.div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="relative py-12 sm:py-16 md:py-20">
        <div className="absolute inset-0 bg-background" />
        <div className="absolute inset-0 jointlly-grid opacity-40" />
        <div className="relative z-10 max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            viewport={{ once: true }}
            className="glass-card p-5 sm:p-6 md:p-8 lg:p-12 text-center bg-gradient-to-br from-primary/5 to-accent/5 border-primary/20"
          >
            <Headphones className="w-12 h-12 sm:w-14 sm:h-14 md:w-16 md:h-16 text-primary mx-auto mb-4 sm:mb-6" />
            <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold mb-3 sm:mb-4">
              Still Have Questions?
            </h2>
            <p className="text-base sm:text-lg text-muted-foreground mb-6 sm:mb-8 max-w-2xl mx-auto px-1">
              Our support team is available 24/7 to help you with any questions or concerns. 
              Don't hesitate to reach out!
            </p>
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-center gap-3 sm:gap-4">
              <a
                href="tel:+919611268009"
                className="btn-premium flex items-center justify-center gap-2 min-h-[44px]"
              >
                <Phone className="w-5 h-5" />
                Call Now
              </a>
              <a
                href="mailto:sales@jointlly.com"
                className="btn-premium-outline flex items-center justify-center gap-2 min-h-[44px]"
              >
                <Mail className="w-5 h-5" />
                Email Us
              </a>
            </div>
          </motion.div>
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default Contact;
