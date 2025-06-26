import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Check } from "@/lib/icons";

interface TemplateSelectorProps {
  selectedTemplate: string;
  onTemplateChange: (templateId: string) => void;
}

export default function TemplateSelector({ selectedTemplate, onTemplateChange }: TemplateSelectorProps) {
  const templates = [
    {
      id: "professional",
      name: "Professional",
      description: "Clean and classic design perfect for corporate environments and traditional industries.",
      tags: ["ATS-Friendly", "Corporate"],
      preview: (
        <div className="bg-white rounded-lg shadow-sm p-4 h-full">
          <div className="border-b border-gray-200 pb-3 mb-3">
            <div className="h-3 bg-gray-800 rounded w-3/4 mb-1"></div>
            <div className="h-2 bg-gray-600 rounded w-1/2"></div>
            <div className="flex space-x-2 mt-2">
              <div className="h-1.5 bg-gray-400 rounded w-1/4"></div>
              <div className="h-1.5 bg-gray-400 rounded w-1/4"></div>
            </div>
          </div>
          <div className="space-y-2">
            <div className="h-2 bg-gray-700 rounded w-1/3"></div>
            <div className="h-1.5 bg-gray-400 rounded w-full"></div>
            <div className="h-1.5 bg-gray-400 rounded w-5/6"></div>
            <div className="h-2 bg-gray-700 rounded w-1/3 mt-3"></div>
            <div className="space-y-1">
              <div className="h-1.5 bg-gray-600 rounded w-2/3"></div>
              <div className="h-1 bg-gray-400 rounded w-1/2"></div>
              <div className="h-1 bg-gray-400 rounded w-3/4"></div>
            </div>
          </div>
        </div>
      ),
    },
    {
      id: "modern",
      name: "Modern",
      description: "Contemporary design with sidebar layout, ideal for creative and tech industries.",
      tags: ["Creative", "Tech"],
      preview: (
        <div className="bg-white rounded-lg shadow-sm p-4 h-full">
          <div className="flex gap-3">
            <div className="w-1/3 bg-purple-50 p-2 rounded">
              <div className="w-8 h-8 bg-gray-300 rounded-full mb-2"></div>
              <div className="space-y-1">
                <div className="h-1 bg-purple-600 rounded w-full"></div>
                <div className="h-1 bg-purple-400 rounded w-3/4"></div>
                <div className="h-1 bg-purple-400 rounded w-1/2"></div>
              </div>
              <div className="mt-3 space-y-1">
                <div className="h-1 bg-gray-600 rounded w-full"></div>
                <div className="h-1 bg-gray-400 rounded w-3/4"></div>
                <div className="h-1 bg-gray-400 rounded w-5/6"></div>
              </div>
            </div>
            <div className="flex-1">
              <div className="h-3 bg-gray-800 rounded w-3/4 mb-1"></div>
              <div className="h-2 bg-gray-600 rounded w-1/2 mb-3"></div>
              <div className="space-y-2">
                <div className="h-2 bg-gray-700 rounded w-1/2"></div>
                <div className="h-1 bg-gray-400 rounded w-full"></div>
                <div className="h-1 bg-gray-400 rounded w-4/5"></div>
              </div>
            </div>
          </div>
        </div>
      ),
    },
    {
      id: "executive",
      name: "Executive",
      description: "Sophisticated design for senior-level positions and executive roles.",
      tags: ["Executive", "Senior"],
      preview: (
        <div className="bg-white rounded-lg shadow-sm p-4 h-full">
          <div className="border-l-4 border-green-500 pl-3">
            <div className="h-3 bg-gray-800 rounded w-3/4 mb-1"></div>
            <div className="h-2 bg-gray-600 rounded w-1/2 mb-3"></div>
            <div className="space-y-2">
              <div className="h-2 bg-gray-700 rounded w-1/3"></div>
              <div className="h-1.5 bg-gray-400 rounded w-full"></div>
              <div className="h-1.5 bg-gray-400 rounded w-5/6"></div>
              <div className="h-2 bg-gray-700 rounded w-1/3 mt-3"></div>
              <div className="grid grid-cols-2 gap-2 mt-2">
                <div className="h-1 bg-green-500 rounded"></div>
                <div className="h-1 bg-green-400 rounded"></div>
                <div className="h-1 bg-green-400 rounded"></div>
                <div className="h-1 bg-green-300 rounded"></div>
              </div>
            </div>
          </div>
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold text-gray-900 mb-2">Choose Template</h3>
        <p className="text-gray-600">
          Select a template that best fits your industry and style preferences.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-6">
        {templates.map((template) => (
          <Card
            key={template.id}
            className={`cursor-pointer transition-all duration-200 hover:shadow-lg ${
              selectedTemplate === template.id
                ? "ring-2 ring-primary border-primary"
                : "hover:border-gray-300"
            }`}
            onClick={() => onTemplateChange(template.id)}
          >
            <CardContent className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* Preview */}
                <div className="md:col-span-1">
                  <div className="bg-gradient-to-br from-blue-100 to-blue-200 p-4 rounded-lg h-48">
                    {template.preview}
                  </div>
                  {selectedTemplate === template.id && (
                    <div className="absolute top-4 right-4 bg-primary rounded-full p-1">
                      <Check className="w-4 h-4 text-white" />
                    </div>
                  )}
                </div>

                {/* Details */}
                <div className="md:col-span-2 space-y-4">
                  <div>
                    <h4 className="text-xl font-bold text-gray-900 mb-2">
                      {template.name}
                    </h4>
                    <p className="text-gray-600 text-sm leading-relaxed">
                      {template.description}
                    </p>
                  </div>

                  <div className="flex flex-wrap gap-2">
                    {template.tags.map((tag) => (
                      <Badge key={tag} variant="secondary">
                        {tag}
                      </Badge>
                    ))}
                  </div>

                  <Button
                    variant={selectedTemplate === template.id ? "default" : "outline"}
                    className="w-full md:w-auto"
                    onClick={(e) => {
                      e.stopPropagation();
                      onTemplateChange(template.id);
                    }}
                  >
                    {selectedTemplate === template.id ? "Selected" : "Use This Template"}
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
