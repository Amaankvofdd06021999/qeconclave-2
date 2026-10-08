import { EditionPage } from '@/components/qe/pages';
import { notFound } from 'next/navigation';
export async function generateMetadata({params}:{params:Promise<{year:string}>}){const {year}=await params;return {title:'QE Conclave '+year}}
export default async function Page({params}:{params:Promise<{year:string}>}){const {year}=await params;if(!['2023','2024','2025'].includes(year))notFound();return <EditionPage year={year}/>}