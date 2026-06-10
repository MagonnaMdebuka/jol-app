import React, { useState, useCallback, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Building2, Check, Loader2 } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { claimVenue, isVenueClaimable } from '../../services/venue.service';
import { useToast } from '../ui/Toast';
import Modal from '../ui/Modal';
import Button from '../ui/Button';

interface IClaimVenueButtonProps {
  venueId: string;
  venueName: string;
}

const ClaimVenueButton: React.FC<IClaimVenueButtonProps> = ({ venueId, venueName }) => {
  const { authUser, isOwner } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();

  const [isClaimable, setIsClaimable] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [claiming, setClaiming] = useState(false);
  const [claimed, setClaimed] = useState(false);

  useEffect(() => {
    const checkClaimable = async () => {
      const claimable = await isVenueClaimable(venueId);
      setIsClaimable(claimable);
    };
    checkClaimable();
  }, [venueId]);

  const handleClaimClick = useCallback(() => {
    if (!authUser) {
      toast('Please sign in as a venue owner to claim this venue', 'error');
      navigate('/owner/login');
      return;
    }
    if (!isOwner) {
      toast('You need an owner account to claim venues', 'error');
      navigate('/owner/register');
      return;
    }
    setShowModal(true);
  }, [authUser, isOwner, toast, navigate]);

  const handleConfirmClaim = useCallback(async () => {
    if (!authUser) return;

    setClaiming(true);
    const { success, error } = await claimVenue(venueId, authUser.id);

    if (success) {
      setClaimed(true);
      toast(`You've claimed ${venueName}! Redirecting to your dashboard...`, 'success');
      setTimeout(() => {
        navigate('/owner/dashboard');
      }, 1500);
    } else {
      toast(error ?? 'Failed to claim venue', 'error');
    }

    setClaiming(false);
    setShowModal(false);
  }, [authUser, venueId, venueName, toast, navigate]);

  // Don't render if venue is not claimable
  if (!isClaimable || claimed) {
    return null;
  }

  return (
    <>
      <button
        onClick={handleClaimClick}
        className="flex items-center gap-2 px-4 py-2.5 bg-nz-accent/10 hover:bg-nz-accent/20 border border-nz-accent/30 rounded-xl text-nz-accent-text text-sm font-medium transition-all duration-200 active:scale-[0.98]"
      >
        <Building2 size={16} />
        <span>Claim this venue</span>
      </button>

      <Modal isOpen={showModal} onClose={() => setShowModal(false)}>
        <div className="flex flex-col gap-5 p-6">
          <div className="flex items-center justify-center w-14 h-14 bg-nz-accent/10 rounded-2xl mx-auto">
            <Building2 className="text-nz-accent" size={28} />
          </div>

          <div className="text-center">
            <h2
              className="text-nz-text text-xl mb-2"
              style={{ fontFamily: '"Bricolage Grotesque", system-ui', fontWeight: 800 }}
            >
              Claim Your Venue
            </h2>
            <p className="text-nz-muted text-sm">
              You're about to claim <span className="text-nz-text font-medium">{venueName}</span>.
              This will link the venue to your owner account.
            </p>
          </div>

          <div className="bg-nz-elevated/50 border border-nz-border/50 rounded-xl p-4">
            <p
              className="text-nz-muted mb-2"
              style={{
                fontFamily: '"JetBrains Mono", monospace',
                fontSize: '9px',
                letterSpacing: '0.04em',
              }}
            >
              WHAT HAPPENS NEXT
            </p>
            <ul className="space-y-2 text-sm text-nz-text">
              <li className="flex items-start gap-2">
                <Check size={14} className="text-nz-accent mt-0.5 shrink-0" />
                <span>This venue becomes yours to manage</span>
              </li>
              <li className="flex items-start gap-2">
                <Check size={14} className="text-nz-accent mt-0.5 shrink-0" />
                <span>You can add events and food listings</span>
              </li>
              <li className="flex items-start gap-2">
                <Check size={14} className="text-nz-accent mt-0.5 shrink-0" />
                <span>Update venue details, photos, and hours</span>
              </li>
            </ul>
          </div>

          <div className="flex gap-3">
            <Button
              variant="secondary"
              onClick={() => setShowModal(false)}
              className="flex-1"
              disabled={claiming}
            >
              Cancel
            </Button>
            <Button onClick={handleConfirmClaim} className="flex-1" disabled={claiming}>
              {claiming ? (
                <>
                  <Loader2 size={16} className="animate-spin mr-2" />
                  Claiming...
                </>
              ) : (
                'Claim Venue'
              )}
            </Button>
          </div>
        </div>
      </Modal>
    </>
  );
};

export default ClaimVenueButton;
