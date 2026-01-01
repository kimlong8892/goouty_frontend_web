import React from 'react';
import { useNavigate } from 'react-router-dom';
import { PWATripTemplatesList } from '@/pwa/components/PWATripTemplatesList.tsx';
import { DATABASE_TYPES } from '@/integrations/api/types';

const TemplatesPage = () => {
  const navigate = useNavigate();

  const handleUseTemplate = (template: DATABASE_TYPES.tripTemplates) => {
    // Navigate to template detail page
    navigate(`/template/${template.id}`);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/5 via-white to-accent/5 pt-20 pb-12">
      <PWATripTemplatesList
        onUseTemplate={handleUseTemplate}
        usingTemplate={false}
      />
    </div>
  );
};

export default TemplatesPage;