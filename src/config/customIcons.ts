import JavaIcon from '@/assets/icons/java.svg';
import KotlinIcon from '@/assets/icons/kotlin.svg';
import GoIcon from '@/assets/icons/go.svg';
import MavenIcon from '@/assets/icons/maven.svg';
import GradleIcon from '@/assets/icons/gradle.svg';
import JavaScriptIcon from '@/assets/icons/javascript.svg';
import TypeScriptIcon from '@/assets/icons/typescript.svg';

export const customIcons: Record<string, React.ComponentType<React.SVGProps<SVGSVGElement>>> = {
  java: JavaIcon,
  kotlin: KotlinIcon,
  go: GoIcon,
  maven: MavenIcon,
  gradle: GradleIcon,
  javascript: JavaScriptIcon,
  typescript: TypeScriptIcon,
};
