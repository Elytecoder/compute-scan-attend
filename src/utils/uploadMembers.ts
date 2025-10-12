import { supabase } from "@/integrations/supabase/client";

// Member data extracted from the Excel file
const membersData = [
  // BSCS Year 1
  { school_id: "25-197015", name: "REXTER FURIO BAILON", program: "BSCS" },
  { school_id: "25-198897", name: "JASPER BONGALOSA BALONA", program: "BSCS" },
  { school_id: "25-100346", name: "JUNIE ANN GUAÑIZO BARRIL", program: "BSCS" },
  { school_id: "25-111663", name: "EZEKIEL LIAN BERTOS", program: "BSCS" },
  { school_id: "25-109419", name: "HEART GELUA BITANCOR", program: "BSCS" },
  { school_id: "25-198896", name: "HANNA BURGOS BRIONES", program: "BSCS" },
  { school_id: "25-102664", name: "MICHAELA PANELO BRIZUELA", program: "BSCS" },
  { school_id: "25-198063", name: "ALEXANDREA ONGOTAN DAGOC", program: "BSCS" },
  { school_id: "25-198918", name: "AIRA NICOLE GIDO DASIG", program: "BSCS" },
  { school_id: "25-199924", name: "RICHARD JR. ERATO DEJUMO", program: "BSCS" },
  { school_id: "25-109996", name: "LARA CRISTINA BARCELO DELIMA", program: "BSCS" },
  { school_id: "25-197192", name: "JASON BALOLOY DOMENS", program: "BSCS" },
  { school_id: "25-104668", name: "JAY LOU GALICIO DOMINGUEZ", program: "BSCS" },
  { school_id: "25-104044", name: "JOHN MARVIN TISOY DUQUE", program: "BSCS" },
  { school_id: "25-108157", name: "JELA GREFALDO ENTERIA", program: "BSCS" },
  { school_id: "25-102960", name: "KEVIN ESCANILLA ERANDIO", program: "BSCS" },
  { school_id: "25-107100", name: "MARZHA LOUISE JAÃ'OLAN FORTES", program: "BSCS" },
  { school_id: "25-110896", name: "CLARISSE GALIT GARAIS", program: "BSCS" },
  { school_id: "24-189249", name: "LOUIS MARIO GARDUQUE", program: "BSCS" },
  { school_id: "25-112126", name: "JAMILA GARBIDA GARDUQUE", program: "BSCS" },
  { school_id: "25-111486", name: "SELWYN SAYSON GELUA", program: "BSCS" },
  { school_id: "25-101920", name: "NICOLE GUBAN GIGANTOCA", program: "BSCS" },
  { school_id: "25-111608", name: "DUALI GOLPEO GILE", program: "BSCS" },
  { school_id: "25-198163", name: "NORELLE CHAIN INFIESTO GLEE", program: "BSCS" },
  { school_id: "25-105006", name: "JIERSON GUETAN GODALLE", program: "BSCS" },
  { school_id: "25-106073", name: "PATRICK EMPLEO GODILO", program: "BSCS" },
  { school_id: "25-107528", name: "MIA GRANTOS GOGOLIN", program: "BSCS" },
  { school_id: "25-106386", name: "GIAN VINCENT GLORIANA GOJAR", program: "BSCS" },
  { school_id: "25-111707", name: "JONARD LOURENZ ABANTE GOMEZ", program: "BSCS" },
  { school_id: "25-199053", name: "LAN MARINDA GOYAL", program: "BSCS" },
  { school_id: "25-108988", name: "VAILYN PANCHO GOYAL", program: "BSCS" },
  { school_id: "25-102194", name: "EMERSON GERONA GURAY", program: "BSCS" },
  { school_id: "25-110233", name: "ROMAN ANDREW VARGAS HERMO", program: "BSCS" },
  { school_id: "25-109753", name: "JOHN CARLO CHIJA HIPOS", program: "BSCS" },
  { school_id: "25-108456", name: "SHANELLE MARIE LORILLA HUBILLA", program: "BSCS" },
  { school_id: "25-108636", name: "DARREN FURING JURADO", program: "BSCS" },
  { school_id: "23-176837", name: "JOHN NOEL DOMINGUEZ LIZANO", program: "BSCS" },
  { school_id: "25-109539", name: "NORMAN TOLOSA LLAGAS", program: "BSCS" },
  { school_id: "25-111130", name: "ARYANNAH KIM MONTICALVO MAHUSAY", program: "BSCS" },
  { school_id: "25-101524", name: "ROMAN AGNOTE MARINDA", program: "BSCS" },
  { school_id: "25-106608", name: "CHARLICE JADE FUENSALIDA MARJALINO", program: "BSCS" },
  { school_id: "25-110661", name: "JANMAR MENIOLA MATAVERDE", program: "BSCS" },
  { school_id: "25-105534", name: "JYRA CORRO MONTICALVO", program: "BSCS" },
  { school_id: "25-198530", name: "CLARENCE GAYTOS MORILLA", program: "BSCS" },
  { school_id: "25-199926", name: "JASMIN HALCON ORTIZ", program: "BSCS" },
  { school_id: "25-101690", name: "ESROM GURAY PANELO", program: "BSCS" },
  { school_id: "25-101894", name: "TRISTAN FLOYD AGNOTE PARANGAT", program: "BSCS" },
  { school_id: "25-100392", name: "RONALD CAMPOSANO PIMENTEL", program: "BSCS" },
  { school_id: "25-199603", name: "ALLIESSA MAE DESUYO REBOSURA", program: "BSCS" },
  { school_id: "25-197220", name: "SUMMER ROSE RESUS RODRIGO", program: "BSCS" },
  { school_id: "25-197149", name: "DESERIE RODRIGUEZ", program: "BSCS" },
  { school_id: "25-105541", name: "SHANNE MADELEINE MORALES SABA", program: "BSCS" },
  { school_id: "25-111833", name: "JOHN PRENZ BORROMEO SACAPAÑO", program: "BSCS" },
  { school_id: "25-107491", name: "JOHN MARINE PRETISTA SALVADOR", program: "BSCS" },
  { school_id: "25-107571", name: "AARON VICTORIOUS SANDOY SAMSON", program: "BSCS" },
  { school_id: "25-105662", name: "CIELO GARAIS TAGLOCOP", program: "BSCS" },
  
  // Add more members data here - this is just a sample
  // You would need to extract all the data from the parsed document
];

export const uploadMembers = async () => {
  const membersToInsert = membersData.map(member => ({
    school_id: member.school_id,
    name: member.name,
    program: member.program as "BSCS" | "BSIT" | "BSIS" | "BTVTED-CSS",
    block: "", // Leave blank as requested
  }));

  const { data, error } = await supabase
    .from("members")
    .insert(membersToInsert)
    .select();

  return { data, error };
};
