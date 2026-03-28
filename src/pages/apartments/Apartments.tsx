import { FormEvent, useEffect, useState } from 'react';
import Card from '../../components/ui/Card';
import Input from '../../components/ui/Input';
import Button from '../../components/ui/Button';
import useAuth from '../../hooks/useAuth';
import { supabase } from '../../lib/supabaseClient';

export default function ApartmentManager() {
  const { user } = useAuth();
  const userId = user?.id;

  const [apartments, setApartments] = useState<any[]>([]);
  const [blocks, setBlocks] = useState<any[]>([]);
  const [houses, setHouses] = useState<any[]>([]);

  const [selectedApartment, setSelectedApartment] = useState<any | null>(null);
  const [selectedBlock, setSelectedBlock] = useState<any | null>(null);

  const [apartmentName, setApartmentName] = useState('');
  const [apartmentLocation, setApartmentLocation] = useState('');
  const [blockName, setBlockName] = useState('');
  const [houseCount, setHouseCount] = useState('');

  const fetchApartments = async () => {
    if (!userId) {
      return;
    }

    const { data } = await supabase
      .from('apartments')
      .select('*')
      .eq('creator_id', userId);
    setApartments(data || []);
  };

  const fetchBlocks = async (apartmentId: string) => {
    const { data } = await supabase
      .from('blocks')
      .select('*')
      .eq('apartment_id', apartmentId);
    setBlocks(data || []);
  };

  const fetchHouses = async (blockId: string) => {
    const { data } = await supabase
      .from('houses')
      .select('*')
      .eq('block_id', blockId);
    setHouses(data || []);
  };

  useEffect(() => {
    if (userId) {
      fetchApartments();
    }
  }, [userId]);

  const createApartment = async (e: FormEvent) => {
    e.preventDefault();
    if (!userId) {
      return;
    }

    await supabase.from('apartments').insert({
      name: apartmentName,
      creator_id: userId,
      location: apartmentLocation
    });

    setApartmentName('');
    setApartmentLocation('');
    fetchApartments();
  };

  const createBlock = async (e: FormEvent) => {
    e.preventDefault();
    if (!selectedApartment?.id) {
      return;
    }

    await supabase.from('blocks').insert({
      apartment_id: selectedApartment.id,
      block_name: blockName
    });

    setBlockName('');
    fetchBlocks(selectedApartment.id);
  };

  const createHouses = async (e: FormEvent) => {
    e.preventDefault();
    if (!selectedBlock?.id) {
      return;
    }

    const count = parseInt(houseCount, 10);
    if (Number.isNaN(count) || count <= 0) {
      return;
    }

    const baseName = selectedBlock.block_name || 'B';
    const newHouses = Array.from({ length: count }).map((_, i) => ({
      block_id: selectedBlock.id,
      house_number: `${baseName}${i + 1}`
    }));

    await supabase.from('houses').insert(newHouses);
    setHouseCount('');
    fetchHouses(selectedBlock.id);
  };

  return (
    <div className="p-6 space-y-6">
      <Card>
        <form onSubmit={createApartment} className="grid gap-2 md:grid-cols-[2fr,2fr,1fr]">
          <Input
            label="Apartment"
            placeholder="Apartment Name"
            value={apartmentName}
            onChange={(e) => setApartmentName(e.target.value)}
          />
          <Input
            label="Location"
            placeholder="City, neighborhood"
            value={apartmentLocation}
            onChange={(e) => setApartmentLocation(e.target.value)}
          />
          <div className="flex">
            <Button type="submit" disabled={!userId} className="px-3 py-2 text-sm w-full">
              Add Apartment
            </Button>
          </div>
        </form>
      </Card>

      <div className="grid grid-cols-3 gap-4">
        {apartments.map((apt) => (
          <Card
            key={apt.id}
            className="cursor-pointer"
            onClick={() => {
              setSelectedApartment(apt);
              setSelectedBlock(null);
              fetchBlocks(apt.id);
            }}
          >
            {apt.name}
            {apt.location && <p className="text-sm text-gray-500">{apt.location}</p>}
          </Card>
        ))}
      </div>

      {selectedApartment && (
        <Card>
          <h2 className="text-lg font-bold mb-2">Blocks - {selectedApartment.name}</h2>

          <form onSubmit={createBlock} className="flex gap-2 mb-4">
            <Input
              label="Block"
              placeholder="Block Name (A, B...)"
              value={blockName}
              onChange={(e) => setBlockName(e.target.value)}
            />
            <Button type="submit" className="px-3 py-2 text-sm">
              Add Block
            </Button>
          </form>

          <div className="flex gap-3">
            {blocks.map((block) => (
              <Card
                key={block.id}
                className="cursor-pointer px-4 py-2"
                onClick={() => {
                  setSelectedBlock(block);
                  fetchHouses(block.id);
                }}
              >
                {block.block_name}
              </Card>
            ))}
          </div>
        </Card>
      )}

      {selectedBlock && (
        <Card>
          <h2 className="text-lg font-bold mb-2">
            Houses - Block {selectedBlock.block_name}
          </h2>

          {houses.length === 0 && (
            <form onSubmit={createHouses} className="flex gap-2 mb-4">
              <Input
                label="Houses"
                placeholder="Number of Houses"
                value={houseCount}
                onChange={(e) => setHouseCount(e.target.value)}
                type="number"
              />
              <Button type="submit" className="px-3 py-2 text-sm">
                Generate Houses
              </Button>
            </form>
          )}

          <div className="grid grid-cols-6 gap-3">
            {houses.map((house) => (
              <div
                key={house.id}
                className={`p-3 rounded-xl text-center cursor-pointer ${
                  house.status === 'occupied' ? 'bg-red-200' : 'bg-green-200'
                }`}
              >
                {house.house_number}
              </div>
            ))}
          </div>
        </Card>
      )}
    </div>
  );
}
