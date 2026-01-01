import React from 'react';

const Footer = () => {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="bg-card border-t border-border mt-auto text-card-foreground">
      <div className="max-w-6xl mx-auto px-4 py-6">
        <div className="text-center text-muted-foreground text-sm">
          © {currentYear} Goouty . All rights reserved.
        </div>
      </div>
    </footer>
  );
};

export default Footer;
