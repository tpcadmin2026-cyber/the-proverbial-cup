import { AdminHeader } from '@/components/admin/AdminHeader'
import { db } from '@/lib/db'
import { notFound } from 'next/navigation'
import { ProductEditor } from './ProductEditor'

interface Props {
  params: Promise<{ productId: string }>
}

export default async function ProductEditorPage({ params }: Props) {
  const { productId } = await params

  if (productId === 'new') {
    return (
      <>
        <AdminHeader title="New product" subtitle="Add a product to your catalogue." />
        <ProductEditor product={null} />
      </>
    )
  }

  const product = await db.product.findUnique({
    where: { id: productId },
    include: { variants: true },
  })

  if (!product) notFound()

  return (
    <>
      <AdminHeader title="Edit product" subtitle={product.name} />
      <ProductEditor product={product} />
    </>
  )
}
