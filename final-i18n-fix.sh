#!/bin/bash

echo "🔧 Final i18n fix for remaining files..."

# Array of files that still need fixing based on build output
files=(
  "src/components/multilang/LanguageSelector.vue"
  "src/components/multilang/MultiLangWordForm.vue"
  "src/components/multilang/QualityFeedbackSystem.vue"
  "src/components/multilang/TranslationProgress.vue"
  "src/components/multilang/TranslationQualityIndicator.vue"
  "src/components/multilang/TranslationValidationModal.vue"
  "src/components/music/DrumStats.vue"
  "src/views/MusicView.vue"
)

for file in "${files[@]}"; do
  if [ -f "$file" ]; then
    echo "Fixing $file..."
    
    # Check if useI18n import exists
    if ! grep -q "import.*useI18n.*from.*vue-i18n" "$file"; then
      echo "  Adding useI18n import..."
      # Find first import line and add useI18n import after it
      sed -i.bak '/^import.*from/a\
import { useI18n } from '\''vue-i18n'\'';
' "$file"
    fi
    
    # Check if const { t } = useI18n() exists
    if ! grep -q "const.*{.*t.*}.*=.*useI18n" "$file"; then
      echo "  Adding const { t } = useI18n()..."
      # Add after first const/interface/defineProps line
      sed -i.bak '/^const\|^interface\|^type\|^defineProps\|^defineEmits/i\
const { t } = useI18n();
' "$file"
    fi
    
    # Remove backup file
    rm -f "$file.bak"
    echo "  ✅ Fixed $file"
  else
    echo "  ❌ $file not found"
  fi
done

echo "🎯 Completed final i18n fixes"