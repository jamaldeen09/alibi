export default async function CaseViewPage ({ params }: { params: Promise<{ id: string }> }) {
    const { id } = await params
    return (
        <div className="text-4xl">You are currently viewing case: {id}</div>
    )
}