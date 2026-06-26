import type { ModuleDef, SubModuleDef } from "@/lib/modules";
import { TicketsMapWorkMap } from "@/components/TicketsMapWorkMap";
export function TicketsMap({ mod, sub }: { mod: ModuleDef; sub: SubModuleDef }) {
  return <TicketsMapWorkMap mod={mod} sub={sub} />;
}
export default TicketsMap;
