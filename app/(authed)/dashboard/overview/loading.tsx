import SkeletonWrapper from "../_components/SkeletonWrapper"
import { DashboardContent } from "./page"

export default function Loading() {
    return (
        <SkeletonWrapper isLoading={true} >
            <DashboardContent />
        </SkeletonWrapper>
    )
}