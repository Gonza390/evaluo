import type {AcquisitionRow,AcquisitionSnapshot} from './acquisition-dashboard-types';
import type {ActivationCohortRow,ActivationCohortSnapshot} from './activation-dashboard-types';

/** Lossless JSON transport for existing dashboard rows. Never render these tuples directly. */
export type PackedDashboardSnapshot={
 version:number;
 from:string;
 through:string;
 coverage:string;
 rows:Array<Array<string|number|boolean|null>>;
};

const acquisitionColumns=[
 'd','channel','page_type','landing','campaign','utm_source','utm_medium','utm_content',
 'device','sessions','clicks','signup_started','registered','uploaded','studied_sessions',
 'activated','step_signup_started','step_registered','step_uploaded','step_studied',
] as const satisfies readonly (keyof AcquisitionRow)[];

const activationColumns=[
 'd','device','source','file_type','first_path','premium','registered','uploaded','ready',
 'failed','opened_material','summary','studied','practice_started','practice_finished',
 'funnel_summary','funnel_practice','funnel_finished','flashcards','guide_started',
 'guide_completed','academic_profile','university','career','profile_completed',
 'read_finished','direct_finished','study_minutes_sum','study_minutes_count',
 'practice_minutes_sum','practice_minutes_count',
] as const satisfies readonly (keyof ActivationCohortRow)[];

function unpackRows<T extends object>(
  packed:PackedDashboardSnapshot,
  columns:readonly (keyof T)[],
):{from:string;through:string;coverage:string;rows:T[]}{
 if(packed.version!==1||!Array.isArray(packed.rows)){
   throw new Error('Versión del formato del dashboard no compatible');
 }
 const rows=packed.rows.map(values=>{
  if(!Array.isArray(values)||values.length!==columns.length){
   throw new Error('Los datos compactados están incompletos');
  }
  const row={} as Record<string,string|number|boolean|null>;
  for(let i=0;i<columns.length;i++)row[columns[i] as string]=values[i];
  return row as T;
 });
 return {from:packed.from,through:packed.through,coverage:packed.coverage,rows};
}

export function unpackAcquisition(packed:PackedDashboardSnapshot):AcquisitionSnapshot{
 return unpackRows<AcquisitionRow>(packed,acquisitionColumns);
}
export function unpackActivation(packed:PackedDashboardSnapshot):ActivationCohortSnapshot{
 return unpackRows<ActivationCohortRow>(packed,activationColumns);
}
